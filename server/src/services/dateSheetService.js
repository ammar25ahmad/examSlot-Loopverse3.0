import DateSheet from '../models/DateSheet.js';
import ExamSlot from '../models/ExamSlot.js';
import CourseAssignment from '../models/CourseAssignment.js';
import Branch from '../models/Branch.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import { ASSIGNMENT_MAX, ASSIGNMENT_MIN } from '../config/constants.js';
import { completionFor } from './assignmentService.js';
import { slotsForCourses } from './examSlotService.js';
import { dayName, intervalsOverlap, resolveInterval, TZ, DEFAULT_DURATION_MINUTES } from '../utils/time.js';
import logger from '../utils/logger.js';

const COURSE_FIELDS = 'code title creditHours department';

async function loadContext(student) {
  const branch = student.selectedBranch ? await Branch.findById(student.selectedBranch) : null;
  const assignments = await CourseAssignment.find({ student: student._id })
    .populate('course', COURSE_FIELDS)
    .lean();
  return { branch, assignments, completion: completionFor(assignments.length) };
}

export async function getBuilderData(student) {
  const { branch, assignments, completion } = await loadContext(student);
  const sheet = await DateSheet.findOne({ student: student._id }).lean();

  const locked = Boolean(sheet && student.dateSheetLocked);
  const canEdit = !locked || Boolean(student.dateSheetChangeEntitlement);
  const currentSlotIds = sheet ? sheet.items.map((i) => i.slot) : [];

  const courseIds = assignments.map((a) => a.course?._id).filter(Boolean);
  const slots = branch
    ? await slotsForCourses(courseIds, branch, { excludeFull: false, includeSlotIds: currentSlotIds })
    : [];

  const slotsByCourse = {};
  for (const slot of slots) {
    const cid = String(slot.course?._id || slot.course);
    if (!slotsByCourse[cid]) slotsByCourse[cid] = [];
    slotsByCourse[cid].push(slot);
  }

  return {
    branch,
    assignments,
    completion,
    hasBranch: Boolean(branch),
    dateSheet: sheet,
    locked,
    canEdit,
    canCreate: Boolean(branch) && completion.isComplete && canEdit,
    slotsByCourse,
    currentSelections: sheet?.items || [],
    universityTimezone: TZ,
    defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
  };
}

export async function getDateSheet(student) {
  const sheet = await DateSheet.findOne({ student: student._id })
    .populate('branch', 'name code city address contactNumber')
    .populate('items.course', COURSE_FIELDS)
    .lean();
  if (!sheet) return null;
  const items = [...sheet.items].sort((a, b) =>
    a.examDate === b.examDate ? a.startTime.localeCompare(b.startTime) : a.examDate.localeCompare(b.examDate)
  );
  return {
    ...sheet,
    items: items.map((i) => ({ ...i, day: dayName(i.examDate) })),
    totalExams: items.length,
  };
}

function buildSelections(body, assignments) {
  const assignedCourseIds = assignments.map((a) => String(a.course._id || a.course));
  const assignedSet = new Set(assignedCourseIds);

  const byCourse = new Map();
  for (const sel of body) {
    const courseId = String(sel.course);
    if (!assignedSet.has(courseId)) {
      throw ApiError.badRequest('You selected a slot for a course that is not assigned to you.', 'UNASSIGNED_COURSE');
    }
    if (byCourse.has(courseId)) {
      throw ApiError.badRequest('You can select only one slot per course.', 'DUPLICATE_COURSE_SELECTION');
    }
    byCourse.set(courseId, String(sel.slot));
  }

  for (const courseId of assignedCourseIds) {
    if (!byCourse.has(courseId)) {
      throw ApiError.badRequest(
        'Every assigned course must have exactly one selected exam slot.',
        'INCOMPLETE_SELECTION'
      );
    }
  }
  return byCourse;
}

function detectConflicts(resolvedItems) {
  const conflicts = [];
  for (let i = 0; i < resolvedItems.length; i += 1) {
    for (let j = i + 1; j < resolvedItems.length; j += 1) {
      const a = resolvedItems[i];
      const b = resolvedItems[j];
      if (intervalsOverlap(a.start, a.end, b.start, b.end)) {
        conflicts.push({
          a: { courseCode: a.courseCode, courseTitle: a.courseTitle, start: a.start, end: a.end },
          b: { courseCode: b.courseCode, courseTitle: b.courseTitle, start: b.start, end: b.end },
        });
      }
    }
  }
  return conflicts;
}

async function reserveSeatOrFail(slotDoc, branch) {
  const capacity = slotDoc.capacityFor(branch._id, branch.seatCapacity);
  const updated = await ExamSlot.reserveSeat(slotDoc._id, branch._id, capacity);
  return updated;
}

/**
 * Persists (creates or, with a one-time entitlement, updates) the student's
 * authoritative date sheet. Enforces branch, assignment, slot ownership,
 * capacity and time-conflict rules server-side. The client's slot times are
 * never trusted — slots are reloaded here.
 */
export async function saveDateSheet(student, body) {
  const { branch, assignments, completion } = await loadContext(student);

  if (!branch) throw ApiError.badRequest('Select an examination branch first.', 'NO_BRANCH');
  if (!completion.isComplete) {
    throw ApiError.forbidden(
      `A date sheet requires between ${ASSIGNMENT_MIN} and ${ASSIGNMENT_MAX} assigned courses.`,
      'ASSIGNMENT_INCOMPLETE'
    );
  }

  const existing = await DateSheet.findOne({ student: student._id });
  const isEdit = Boolean(existing && student.dateSheetLocked);

  let entitlementConsumed = false;
  if (isEdit) {
    // Atomically consume the one-time entitlement before doing any work.
    const consumed = await Student.findOneAndUpdate(
      { _id: student._id, dateSheetChangeEntitlement: true },
      { $set: { dateSheetChangeEntitlement: false } },
      { new: true }
    );
    if (!consumed) {
      throw ApiError.conflict(
        'Your date sheet is locked. An approved date sheet change request is required.',
        'DATE_SHEET_LOCKED'
      );
    }
    entitlementConsumed = true;
  } else if (existing) {
    // Existing sheet that is not locked should not normally occur.
    throw ApiError.conflict('A date sheet already exists for this student.', 'DATE_SHEET_EXISTS');
  }

  const restoreEntitlement = async () => {
    if (entitlementConsumed) {
      await Student.updateOne({ _id: student._id }, { $set: { dateSheetChangeEntitlement: true } });
    }
  };

  try {
    const byCourse = buildSelections(body, assignments);

    // Reload every selected slot from the database; do not trust the client.
    const slotIds = [...byCourse.values()];
    const slotDocs = await ExamSlot.find({ _id: { $in: slotIds } }).populate('course', COURSE_FIELDS);
    const slotById = new Map(slotDocs.map((s) => [String(s._id), s]));

    const resolvedItems = [];
    for (const assignment of assignments) {
      const courseId = String(assignment.course._id || assignment.course);
      const slotId = byCourse.get(courseId);
      const slot = slotById.get(slotId);
      if (!slot) throw ApiError.badRequest('A selected exam slot no longer exists.', 'SLOT_NOT_FOUND');
      if (!slot.isActive) throw ApiError.badRequest('A selected exam slot is no longer active.', 'SLOT_INACTIVE');
      if (String(slot.course?._id || slot.course) !== courseId) {
        throw ApiError.badRequest('A selected slot does not belong to its assigned course.', 'SLOT_COURSE_MISMATCH');
      }
      const { start, end } = resolveInterval(slot.examDate, slot.startTime, slot.endTime);
      resolvedItems.push({
        course: assignment.course._id,
        slot: slot._id,
        courseCode: slot.course.code,
        courseTitle: slot.course.title,
        examDate: slot.examDate,
        startTime: slot.startTime,
        endTime: slot.endTime || '',
        start,
        end,
      });
    }

    // Time-conflict detection.
    const conflicts = detectConflicts(resolvedItems);
    if (conflicts.length) {
      const first = conflicts[0];
      throw ApiError.conflict(
        `Schedule conflict: ${first.a.courseCode} and ${first.b.courseCode} overlap. Adjust your selections.`,
        'TIME_CONFLICT',
        conflicts.map((c) => ({
          courses: [c.a.courseCode, c.b.courseCode],
          a: `${c.a.courseCode} ${c.a.start.toISOString()}`,
          b: `${c.b.courseCode} ${c.b.start.toISOString()}`,
        }))
      );
    }

    // Determine which seats to reserve / release relative to the previous sheet.
    const previousSlotIds = existing ? existing.items.map((i) => String(i.slot)) : [];
    const newSlotIds = resolvedItems.map((i) => String(i.slot));
    const previousSet = new Set(previousSlotIds);
    const newSet = new Set(newSlotIds);

    const toReserve = resolvedItems.filter((i) => !previousSet.has(String(i.slot)));
    const toRelease = [...previousSet].filter((id) => !newSet.has(id));

    const reserved = [];
    for (const item of toReserve) {
      const slotDoc = slotById.get(String(item.slot));
      const ok = await reserveSeatOrFail(slotDoc, branch);
      if (!ok) {
        for (const r of reserved) await ExamSlot.releaseSeat(r.slot, branch._id);
        throw ApiError.conflict(
          `${item.courseCode} at the selected time is full for your branch. Choose another slot.`,
          'SLOT_FULL'
        );
      }
      reserved.push(item);
    }

    // Order items chronologically for the authoritative record.
    const sortedItems = resolvedItems
      .map(({ start, end, ...rest }) => rest)
      .sort((a, b) =>
        a.examDate === b.examDate ? a.startTime.localeCompare(b.startTime) : a.examDate.localeCompare(b.examDate)
      );

    let saved;
    try {
      if (existing) {
        existing.branch = branch._id;
        existing.items = sortedItems;
        existing.version += 1;
        existing.locked = true;
        existing.savedAt = new Date();
        existing.markModified('items');
        await existing.save();
        saved = existing;
      } else {
        saved = await DateSheet.create({
          student: student._id,
          branch: branch._id,
          items: sortedItems,
          locked: true,
          savedAt: new Date(),
          version: 1,
        });
      }
    } catch (err) {
      // Roll back any reservations on persistence failure.
      for (const r of reserved) await ExamSlot.releaseSeat(r.slot, branch._id);
      throw err;
    }

    // Release seats no longer held (best-effort, after persistence).
    for (const slotId of toRelease) {
      await ExamSlot.releaseSeat(slotId, branch._id);
    }

    await Student.updateOne({ _id: student._id }, { $set: { dateSheetLocked: true } });

    return getDateSheet({ _id: student._id });
  } catch (err) {
    await restoreEntitlement();
    throw err;
  }
}

export async function dateSheetExists(studentId) {
  return Boolean(await DateSheet.exists({ student: studentId }));
}

export default { getBuilderData, getDateSheet, saveDateSheet, dateSheetExists };

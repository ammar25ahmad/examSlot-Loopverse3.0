import ExamSlot from '../models/ExamSlot.js';
import Course from '../models/Course.js';
import DateSheet from '../models/DateSheet.js';
import Branch from '../models/Branch.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, escapeRegExp, parsePagination } from '../utils/pagination.js';
import {
  combineDateTimeInTz,
  dayName,
  formatInTz,
  isPastDate,
  resolveInterval,
  todayInTz,
} from '../utils/time.js';

const COURSE_FIELDS = 'code title creditHours department isActive';

function assertValidTimes({ examDate, startTime, endTime }) {
  if (isPastDate(examDate)) {
    throw ApiError.badRequest('Exam slots cannot be scheduled in the past.', 'PAST_SLOT');
  }
  const { start, end } = resolveInterval(examDate, startTime, endTime);
  if (endTime && end <= start) {
    throw ApiError.badRequest('End time must be later than start time.', 'INVALID_TIME_RANGE');
  }
  if (start.getTime() < Date.now() - 60 * 1000) {
    throw ApiError.badRequest('Exam start time is already in the past.', 'PAST_SLOT');
  }
}

export function serializeSlot(slot, branchId, defaultCapacity) {
  const booked = branchId ? slot.booked?.get?.(String(branchId)) || 0 : 0;
  const capacity = branchId ? slot.capacityFor(branchId, defaultCapacity) : defaultCapacity;
  return {
    ...slot.toObject ? slot.toObject() : slot,
    day: dayName(slot.examDate),
    startDisplay: formatInTz(combineDateTimeInTz(slot.examDate, slot.startTime), 'HH:mm'),
    endDisplay: slot.endTime
      ? formatInTz(combineDateTimeInTz(slot.examDate, slot.endTime), 'HH:mm')
      : '',
    availableSeats: branchId ? Math.max(0, capacity - booked) : null,
    capacity: branchId ? capacity : null,
    booked: branchId ? booked : null,
    isFull: branchId ? capacity - booked <= 0 : false,
  };
}

export async function listExamSlots(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.courseId) filter.course = query.courseId;
  if (query.date) filter.examDate = query.date;
  if (query.from) filter.examDate = { ...(filter.examDate || {}), $gte: query.from };
  if (query.to) filter.examDate = { ...(filter.examDate || {}), $lte: query.to };
  if (query.status === 'active') filter.isActive = true;
  else if (query.status === 'inactive') filter.isActive = false;

  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    const courses = await Course.find({ $or: [{ code: rx }, { title: rx }] }).select('_id').lean();
    filter.course = { $in: courses.map((c) => c._id) };
  }

  const [slots, totalItems] = await Promise.all([
    ExamSlot.find(filter)
      .populate('course', COURSE_FIELDS)
      .sort({ examDate: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ExamSlot.countDocuments(filter),
  ]);

  const data = slots.map((s) => ({ ...s, day: dayName(s.examDate) }));
  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function getExamSlot(id) {
  const slot = await ExamSlot.findById(id).populate('course', COURSE_FIELDS);
  if (!slot) throw ApiError.notFound('Exam slot not found', 'SLOT_NOT_FOUND');
  return slot;
}

export async function createExamSlot(payload) {
  const course = await Course.findById(payload.course).select('_id isActive');
  if (!course) throw ApiError.badRequest('Course does not exist.', 'INVALID_COURSE');

  assertValidTimes(payload);

  const existing = await ExamSlot.findOne({
    course: payload.course,
    examDate: payload.examDate,
    startTime: payload.startTime,
    endTime: payload.endTime || '',
  });
  if (existing) {
    throw ApiError.conflict('A slot already exists for this course and time.', 'DUPLICATE_SLOT');
  }
  return ExamSlot.create(payload);
}

const TIME_FIELDS = ['course', 'examDate', 'startTime', 'endTime'];

export async function updateExamSlot(id, payload) {
  const slot = await ExamSlot.findById(id);
  if (!slot) throw ApiError.notFound('Exam slot not found', 'SLOT_NOT_FOUND');

  const next = {
    course: payload.course || slot.course,
    examDate: payload.examDate || slot.examDate,
    startTime: payload.startTime || slot.startTime,
    endTime: payload.endTime !== undefined ? payload.endTime : slot.endTime,
  };

  const timeFieldsChanged = TIME_FIELDS.some(
    (f) => payload[f] !== undefined && String(payload[f]) !== String(slot[f])
  );

  if (timeFieldsChanged) {
    const referenced = await countSlotReferences(id);
    if (referenced > 0) {
      throw ApiError.conflict(
        `This slot is part of ${referenced} saved date sheet(s). Changing its time would invalidate them. Deactivate and create a replacement instead.`,
        'SLOT_IN_USE'
      );
    }
    assertValidTimes(next);

    const dup = await ExamSlot.findOne({
      _id: { $ne: slot._id },
      course: next.course,
      examDate: next.examDate,
      startTime: next.startTime,
      endTime: next.endTime || '',
    });
    if (dup) throw ApiError.conflict('A duplicate slot already exists for this course and time.', 'DUPLICATE_SLOT');
  }

  for (const key of ['course', 'examDate', 'startTime', 'endTime', 'isActive']) {
    if (payload[key] !== undefined) slot[key] = payload[key];
  }
  if (payload.capacity !== undefined) {
    slot.capacity = new Map(Object.entries(payload.capacity).map(([k, v]) => [k, Number(v)]));
  }
  await slot.save();
  return slot;
}

async function countSlotReferences(slotId) {
  return DateSheet.countDocuments({ 'items.slot': slotId });
}

export async function slotDependencies(slotId) {
  const sheets = await DateSheet.find({ 'items.slot': slotId })
    .populate('student', 'fullName registrationNumber')
    .select('student')
    .lean();
  return {
    dateSheets: sheets.length,
    students: sheets.map((s) => s.student).filter(Boolean),
  };
}

export async function deleteExamSlot(id) {
  const slot = await ExamSlot.findById(id);
  if (!slot) throw ApiError.notFound('Exam slot not found', 'SLOT_NOT_FOUND');

  const refs = await countSlotReferences(id);
  if (refs > 0) {
    throw ApiError.conflict(
      `This slot is used by ${refs} saved date sheet(s). Deactivate it instead of deleting.`,
      'SLOT_IN_USE'
    );
  }
  await slot.deleteOne();
  return { deleted: true };
}

/**
 * Active slots for a set of courses, annotated with availability for the
 * student's branch. Full slots are excluded unless they are the student's own
 * current selection (handled by the caller).
 */
export async function slotsForCourses(courseIds, branch, { excludeFull = false, includeSlotIds = [] } = {}) {
  if (!courseIds?.length) return [];
  const slots = await ExamSlot.find({ course: { $in: courseIds }, isActive: true })
    .populate('course', COURSE_FIELDS)
    .sort({ examDate: 1, startTime: 1 })
    .lean();

  const defaultCapacity = branch?.seatCapacity ?? 60;
  const include = new Set(includeSlotIds.map(String));

  return slots
    .map((s) => {
      const booked = s.booked?.[String(branch?._id)] || 0;
      const override = s.capacity?.[String(branch?._id)];
      const capacity = Number.isFinite(override) ? override : defaultCapacity;
      const availableSeats = Math.max(0, capacity - booked);
      return { ...s, day: dayName(s.examDate), availableSeats, capacity, booked, isFull: availableSeats <= 0 };
    })
    .filter((s) => !excludeFull || !s.isFull || include.has(String(s._id)));
}

export { assertValidTimes, countSlotReferences, todayInTz };

export default {
  listExamSlots,
  getExamSlot,
  createExamSlot,
  updateExamSlot,
  deleteExamSlot,
  slotDependencies,
  slotsForCourses,
  serializeSlot,
};

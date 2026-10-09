import Student from '../models/Student.js';
import Branch from '../models/Branch.js';
import DateSheet from '../models/DateSheet.js';
import CourseAssignment from '../models/CourseAssignment.js';
import ChangeRequest from '../models/ChangeRequest.js';
import ExamSlot from '../models/ExamSlot.js';
import ApiError from '../utils/ApiError.js';
import { completionFor } from './assignmentService.js';
import { dayName, todayInTz } from '../utils/time.js';

const COURSE_FIELDS = 'code title creditHours department';

export async function listActiveBranches() {
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  return branches.map((b) => ({ ...b }));
}

export async function getProfile(student) {
  const populated = await Student.findById(student._id)
    .populate('selectedBranch', 'name code city address contactNumber seatCapacity')
    .lean();
  return populated;
}

export async function selectBranch(student, branchId) {
  const branch = await Branch.findById(branchId);
  if (!branch || !branch.isActive) {
    throw ApiError.badRequest('That branch is not available for selection.', 'BRANCH_UNAVAILABLE');
  }

  const alreadySelected = Boolean(student.selectedBranch);
  let updated;
  let entitlementConsumed = false;

  if (alreadySelected) {
    // Only an approved one-time entitlement permits a change.
    updated = await Student.findOneAndUpdate(
      { _id: student._id, branchChangeEntitlement: true },
      { $set: { branchChangeEntitlement: false, selectedBranch: branch._id, branchSelectedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      throw ApiError.conflict(
        'You have already selected a branch. Submit a branch change request for approval.',
        'BRANCH_ALREADY_SELECTED'
      );
    }
    entitlementConsumed = true;
  } else {
    // Atomic exactly-once first selection.
    updated = await Student.findOneAndUpdate(
      { _id: student._id, selectedBranch: null },
      { $set: { selectedBranch: branch._id, branchSelectedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      throw ApiError.conflict('A branch has already been selected for this account.', 'BRANCH_ALREADY_SELECTED');
    }
  }

  // A branch change invalidates the previous branch's seat reservations.
  let dateSheetReset = false;
  let previousBranch = null;
  if (entitlementConsumed) {
    const sheet = await DateSheet.findOne({ student: student._id });
    if (sheet) {
      previousBranch = String(sheet.branch);
      for (const item of sheet.items) {
        await ExamSlot.releaseSeat(item.slot, sheet.branch);
      }
      await sheet.deleteOne();
      dateSheetReset = true;
    }
    await Student.updateOne({ _id: student._id }, { $set: { dateSheetLocked: false } });
  }

  return {
    student: await Student.findById(student._id).populate('selectedBranch', 'name code city'),
    dateSheetReset,
    previousBranch,
    entitlementConsumed,
  };
}

export async function getDashboard(student) {
  const today = todayInTz();
  const [assignments, sheet, requests] = await Promise.all([
    CourseAssignment.find({ student: student._id }).populate('course', COURSE_FIELDS).lean(),
    DateSheet.findOne({ student: student._id })
      .populate('branch', 'name code city')
      .populate('items.course', COURSE_FIELDS)
      .lean(),
    ChangeRequest.find({ student: student._id }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const completion = completionFor(assignments.length);
  const branch = student.selectedBranch
    ? await Branch.findById(student.selectedBranch).select('name code city address contactNumber').lean()
    : null;

  const upcomingExams = sheet
    ? sheet.items
        .filter((i) => i.examDate >= today)
        .sort((a, b) =>
          a.examDate === b.examDate ? a.startTime.localeCompare(b.startTime) : a.examDate.localeCompare(b.examDate)
        )
        .map((i) => ({ ...i, day: dayName(i.examDate) }))
    : [];

  return {
    student: {
      fullName: student.fullName,
      registrationNumber: student.registrationNumber,
      program: student.program,
      semester: student.semester,
      session: student.session,
      email: student.email,
      accountStatus: student.accountStatus,
    },
    branch,
    assignmentCompletion: completion,
    dateSheet: sheet
      ? {
          exists: true,
          locked: student.dateSheetLocked,
          totalExams: sheet.items.length,
          savedAt: sheet.savedAt,
          version: sheet.version,
        }
      : { exists: false, locked: false, totalExams: 0 },
    upcomingExams,
    recentRequests: requests,
    entitlements: {
      branchChange: student.branchChangeEntitlement,
      dateSheetChange: student.dateSheetChangeEntitlement,
    },
  };
}

export default { listActiveBranches, getProfile, selectBranch, getDashboard };

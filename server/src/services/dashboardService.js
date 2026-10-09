import Student from '../models/Student.js';
import Branch from '../models/Branch.js';
import Course from '../models/Course.js';
import ExamSlot from '../models/ExamSlot.js';
import DateSheet from '../models/DateSheet.js';
import CourseAssignment from '../models/CourseAssignment.js';
import ChangeRequest from '../models/ChangeRequest.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { ASSIGNMENT_MAX, ASSIGNMENT_MIN, REQUEST_STATUS, REQUEST_TYPE } from '../config/constants.js';

export async function getDashboard() {
  const [
    totalStudents,
    activeBranches,
    activeCourses,
    totalExamSlots,
    completedSheets,
    assignmentGroups,
    pendingByType,
    recentActivity,
    pendingRequests,
  ] = await Promise.all([
    Student.countDocuments({}),
    Branch.countDocuments({ isActive: true }),
    Course.countDocuments({ isActive: true }),
    ExamSlot.countDocuments({ isActive: true }),
    DateSheet.countDocuments({}),
    CourseAssignment.aggregate([{ $group: { _id: '$student', count: { $sum: 1 } } }]),
    ChangeRequest.aggregate([
      { $match: { status: REQUEST_STATUS.PENDING } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    AdminAuditLog.find().sort({ createdAt: -1 }).limit(8).populate('actor', 'name').lean(),
    ChangeRequest.find({ status: REQUEST_STATUS.PENDING })
      .populate('student', 'fullName registrationNumber')
      .sort({ createdAt: 1 })
      .limit(5)
      .lean(),
  ]);

  const completeAssignments = assignmentGroups.filter(
    (g) => g.count >= ASSIGNMENT_MIN && g.count <= ASSIGNMENT_MAX
  ).length;
  const incompleteAssignments = Math.max(0, totalStudents - completeAssignments);
  const notCompletedSheets = Math.max(0, totalStudents - completedSheets);

  const pending = { [REQUEST_TYPE.BRANCH_CHANGE]: 0, [REQUEST_TYPE.DATE_SHEET_CHANGE]: 0, total: 0 };
  for (const row of pendingByType) {
    pending[row._id] = row.count;
    pending.total += row.count;
  }

  return {
    metrics: {
      totalStudents,
      activeBranches,
      activeCourses,
      totalExamSlots,
      completedSheets,
      incompleteAssignments,
      pendingRequests: pending.total,
    },
    charts: {
      dateSheetCompletion: [
        { name: 'Date sheet saved', value: completedSheets },
        { name: 'No date sheet', value: notCompletedSheets },
      ],
      assignmentReadiness: [
        { name: 'Ready (4–6)', value: completeAssignments },
        { name: 'Incomplete', value: incompleteAssignments },
      ],
      pendingByType: [
        { name: 'Branch change', value: pending[REQUEST_TYPE.BRANCH_CHANGE] },
        { name: 'Date sheet change', value: pending[REQUEST_TYPE.DATE_SHEET_CHANGE] },
      ],
    },
    recentActivity,
    pendingRequests,
    isEmpty: totalStudents === 0 && activeBranches === 0 && activeCourses === 0,
  };
}

export default { getDashboard };

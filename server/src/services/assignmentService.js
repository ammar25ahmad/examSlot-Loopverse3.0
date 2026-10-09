import CourseAssignment from '../models/CourseAssignment.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import { ASSIGNMENT_MAX, ASSIGNMENT_MIN } from '../config/constants.js';
import { buildPaginationMeta, escapeRegExp, parsePagination } from '../utils/pagination.js';
import { withTransaction } from '../config/db.js';

const COURSE_FIELDS = 'code title creditHours department isActive';
const STUDENT_FIELDS = 'fullName registrationNumber email program semester isActive';

export function completionFor(count) {
  return {
    count,
    min: ASSIGNMENT_MIN,
    max: ASSIGNMENT_MAX,
    isComplete: count >= ASSIGNMENT_MIN && count <= ASSIGNMENT_MAX,
  };
}

export async function listAssignments(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.studentId) filter.student = query.studentId;
  if (query.courseId) filter.course = query.courseId;

  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    const [courses, students] = await Promise.all([
      Course.find({ $or: [{ code: rx }, { title: rx }] }).select('_id').lean(),
      Student.find({ $or: [{ fullName: rx }, { registrationNumber: rx }] }).select('_id').lean(),
    ]);
    filter.$or = [
      { course: { $in: courses.map((c) => c._id) } },
      { student: { $in: students.map((s) => s._id) } },
    ];
  }

  const [data, totalItems] = await Promise.all([
    CourseAssignment.find(filter)
      .populate('course', COURSE_FIELDS)
      .populate('student', STUDENT_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseAssignment.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function getStudentAssignments(studentId) {
  const student = await Student.findById(studentId).select('fullName registrationNumber dateSheetLocked dateSheetChangeEntitlement');
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');

  const assignments = await CourseAssignment.find({ student: studentId })
    .populate('course', COURSE_FIELDS)
    .sort({ createdAt: 1 })
    .lean();

  return {
    student: {
      _id: student._id,
      fullName: student.fullName,
      registrationNumber: student.registrationNumber,
      dateSheetLocked: student.dateSheetLocked,
      dateSheetChangeEntitlement: student.dateSheetChangeEntitlement,
    },
    assignments,
    completion: completionFor(assignments.length),
  };
}

async function assertAssignmentsEditable(student) {
  if (student.dateSheetLocked && !student.dateSheetChangeEntitlement) {
    throw ApiError.conflict(
      'This student has a locked date sheet. Approve a date sheet change request before editing assignments.',
      'DATE_SHEET_LOCKED'
    );
  }
}

async function assertCoursesExist(courseIds) {
  const courses = await Course.find({ _id: { $in: courseIds } }).select('_id');
  if (courses.length !== courseIds.length) {
    throw ApiError.badRequest('One or more selected courses do not exist.', 'INVALID_COURSE');
  }
}

/** Replaces a student's whole assignment set (4–6 distinct courses). */
export async function setAssignments(studentId, courseIds) {
  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  await assertAssignmentsEditable(student);
  await assertCoursesExist(courseIds);

  const docs = courseIds.map((course) => ({ student: student._id, course }));

  await withTransaction(async (session) => {
    const opts = session ? { session } : {};
    await CourseAssignment.deleteMany({ student: student._id }, opts);
    await CourseAssignment.insertMany(docs, opts);
  });

  return getStudentAssignments(studentId);
}

export async function addAssignment({ student: studentId, course: courseId }) {
  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  await assertAssignmentsEditable(student);

  const course = await Course.findById(courseId).select('_id isActive');
  if (!course) throw ApiError.badRequest('Course does not exist.', 'INVALID_COURSE');
  if (!course.isActive) throw ApiError.badRequest('This course is inactive.', 'INACTIVE_COURSE');

  const dup = await CourseAssignment.findOne({ student: studentId, course: courseId });
  if (dup) throw ApiError.conflict('This course is already assigned to the student.', 'DUPLICATE_ASSIGNMENT');

  const count = await CourseAssignment.countDocuments({ student: studentId });
  if (count >= ASSIGNMENT_MAX) {
    throw ApiError.conflict(`A student can have at most ${ASSIGNMENT_MAX} courses.`, 'ASSIGNMENT_LIMIT');
  }

  const created = await CourseAssignment.create({ student: studentId, course: courseId });
  return created;
}

export async function removeAssignment(id) {
  const assignment = await CourseAssignment.findById(id);
  if (!assignment) throw ApiError.notFound('Assignment not found', 'ASSIGNMENT_NOT_FOUND');

  const student = await Student.findById(assignment.student);
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  await assertAssignmentsEditable(student);

  await assignment.deleteOne();
  return { deleted: true, student: String(student._id) };
}

export default {
  listAssignments,
  getStudentAssignments,
  setAssignments,
  addAssignment,
  removeAssignment,
  completionFor,
};

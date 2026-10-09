import Course from '../models/Course.js';
import CourseAssignment from '../models/CourseAssignment.js';
import ExamSlot from '../models/ExamSlot.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, escapeRegExp, parsePagination } from '../utils/pagination.js';

export async function listCourses(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status === 'active') filter.isActive = true;
  else if (query.status === 'inactive') filter.isActive = false;
  if (query.department) filter.department = new RegExp(`^${escapeRegExp(query.department)}`, 'i');
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$or = [{ code: rx }, { title: rx }, { department: rx }];
  }

  const [data, totalItems] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Course.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function getCourse(id) {
  const course = await Course.findById(id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  return course;
}

export async function createCourse(payload) {
  const existing = await Course.findOne({ code: payload.code.toUpperCase() });
  if (existing) throw ApiError.conflict('A course with this code already exists.', 'DUPLICATE_COURSE_CODE');
  return Course.create(payload);
}

const UPDATABLE = ['code', 'title', 'creditHours', 'department', 'isActive'];

export async function updateCourse(id, payload) {
  const course = await Course.findById(id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  if (payload.code && payload.code.toUpperCase() !== course.code) {
    const dup = await Course.findOne({ code: payload.code.toUpperCase(), _id: { $ne: course._id } });
    if (dup) throw ApiError.conflict('A course with this code already exists.', 'DUPLICATE_COURSE_CODE');
  }

  for (const key of UPDATABLE) {
    if (payload[key] !== undefined) course[key] = payload[key];
  }
  await course.save();
  return course;
}

export async function courseDependencies(id) {
  const [assignments, slots] = await Promise.all([
    CourseAssignment.countDocuments({ course: id }),
    ExamSlot.countDocuments({ course: id }),
  ]);
  return { assignments, slots, total: assignments + slots };
}

export async function deleteCourse(id) {
  const course = await Course.findById(id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const deps = await courseDependencies(id);
  if (deps.total > 0) {
    throw ApiError.conflict(
      `This course has ${deps.assignments} assignment(s) and ${deps.slots} exam slot(s). Deactivate it instead of deleting.`,
      'COURSE_IN_USE'
    );
  }
  await course.deleteOne();
  return { deleted: true };
}

export default { listCourses, getCourse, createCourse, updateCourse, deleteCourse, courseDependencies };

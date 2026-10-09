import * as courseService from '../services/courseService.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTION } from '../config/constants.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  const { data, pagination } = await courseService.listCourses(req.query);
  return sendPaginated(res, data, pagination);
}

export async function get(req, res) {
  const course = await courseService.getCourse(req.params.id);
  return sendSuccess(res, course);
}

export async function create(req, res) {
  const course = await courseService.createCourse(req.body);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.COURSE_CREATED,
    entityType: 'Course',
    entityId: course._id,
    description: `Created course ${course.code}`,
    req,
  });
  return sendCreated(res, course);
}

export async function update(req, res) {
  const course = await courseService.updateCourse(req.params.id, req.body);
  const deactivated = req.body.isActive === false;
  await recordAudit({
    actor: req.admin,
    action: deactivated ? AUDIT_ACTION.COURSE_DEACTIVATED : AUDIT_ACTION.COURSE_UPDATED,
    entityType: 'Course',
    entityId: course._id,
    description: `${deactivated ? 'Deactivated' : 'Updated'} course ${course.code}`,
    req,
  });
  return sendSuccess(res, course);
}

export async function remove(req, res) {
  const result = await courseService.deleteCourse(req.params.id);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.COURSE_DEACTIVATED,
    entityType: 'Course',
    entityId: req.params.id,
    description: 'Deleted unused course',
    req,
  });
  return sendSuccess(res, result);
}

export async function dependencies(req, res) {
  const deps = await courseService.courseDependencies(req.params.id);
  return sendSuccess(res, deps);
}

export default { list, get, create, update, remove, dependencies };

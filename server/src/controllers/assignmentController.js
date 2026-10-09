import * as assignmentService from '../services/assignmentService.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTION } from '../config/constants.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  const { data, pagination } = await assignmentService.listAssignments(req.query);
  return sendPaginated(res, data, pagination);
}

export async function listForStudent(req, res) {
  const result = await assignmentService.getStudentAssignments(req.params.studentId);
  return sendSuccess(res, result);
}

export async function create(req, res) {
  const assignment = await assignmentService.addAssignment(req.body);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.ASSIGNMENT_UPDATED,
    entityType: 'CourseAssignment',
    entityId: assignment._id,
    description: 'Added a course assignment',
    metadata: { student: String(req.body.student), course: String(req.body.course) },
    req,
  });
  return sendCreated(res, assignment);
}

export async function update(req, res) {
  // PATCH /assignments/:id previously supported changing the course; we now
  // direct callers to the bulk set endpoint to keep the 4–6 invariant.
  const result = await assignmentService.removeAssignment(req.params.id);
  return sendSuccess(res, result);
}

export async function remove(req, res) {
  const result = await assignmentService.removeAssignment(req.params.id);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.ASSIGNMENT_UPDATED,
    entityType: 'CourseAssignment',
    entityId: req.params.id,
    description: 'Removed a course assignment',
    req,
  });
  return sendSuccess(res, result);
}

export async function setForStudent(req, res) {
  const result = await assignmentService.setAssignments(req.params.studentId, req.body.courseIds);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.ASSIGNMENT_UPDATED,
    entityType: 'Student',
    entityId: req.params.studentId,
    description: `Set ${req.body.courseIds.length} course assignments`,
    metadata: { count: req.body.courseIds.length },
    req,
  });
  return sendSuccess(res, result);
}

export default { list, listForStudent, create, update, remove, setForStudent };

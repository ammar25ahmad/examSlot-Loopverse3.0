import * as studentService from '../services/studentService.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTION } from '../config/constants.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  const { data, pagination } = await studentService.listStudents(req.query);
  return sendPaginated(res, data, pagination);
}

export async function get(req, res) {
  const student = await studentService.getStudent(req.params.id);
  return sendSuccess(res, student);
}

export async function create(req, res) {
  const { student, setup } = await studentService.createStudent(req.body);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.STUDENT_CREATED,
    entityType: 'Student',
    entityId: student._id,
    description: `Created student ${student.registrationNumber}`,
    req,
  });
  return sendCreated(res, { student, setup });
}

export async function update(req, res) {
  const student = await studentService.updateStudent(req.params.id, req.body);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.STUDENT_UPDATED,
    entityType: 'Student',
    entityId: student._id,
    description: `Updated student ${student.registrationNumber}`,
    req,
  });
  return sendSuccess(res, student);
}

export async function remove(req, res) {
  const result = await studentService.deleteStudent(req.params.id);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.STUDENT_DEACTIVATED,
    entityType: 'Student',
    entityId: req.params.id,
    description: result.deleted ? 'Deleted student' : 'Deactivated student',
    req,
  });
  return sendSuccess(res, result);
}

export async function setActive(req, res) {
  const student = await studentService.setStudentActive(req.params.id, req.body.isActive);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.STUDENT_UPDATED,
    entityType: 'Student',
    entityId: student._id,
    description: `${req.body.isActive ? 'Activated' : 'Deactivated'} student ${student.registrationNumber}`,
    req,
  });
  return sendSuccess(res, student);
}

export async function resendSetup(req, res) {
  const result = await studentService.resendSetupEmail(req.params.id);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.SETUP_EMAIL_RESENT,
    entityType: 'Student',
    entityId: req.params.id,
    description: 'Resent account setup email',
    req,
  });
  return sendSuccess(res, result);
}

export async function dependencies(req, res) {
  const deps = await studentService.studentDependencies(req.params.id);
  return sendSuccess(res, deps);
}

export default { list, get, create, update, remove, setActive, resendSetup, dependencies };

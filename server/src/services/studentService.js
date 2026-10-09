import Student from '../models/Student.js';
import CourseAssignment from '../models/CourseAssignment.js';
import DateSheet from '../models/DateSheet.js';
import ChangeRequest from '../models/ChangeRequest.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_STATUS, EMAIL_STATUS } from '../config/constants.js';
import { buildPaginationMeta, escapeRegExp, parsePagination } from '../utils/pagination.js';
import { issueSetupTokenAndSend } from './authService.js';

export const STUDENT_PUBLIC_FIELDS =
  '-passwordHash -setupTokenHash -setupTokenExpiresAt -resetTokenHash -resetTokenExpiresAt';

export async function listStudents(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status === 'active') filter.isActive = true;
  else if (query.status === 'inactive') filter.isActive = false;
  if (query.accountStatus) filter.accountStatus = query.accountStatus;
  if (query.branchId) filter.selectedBranch = query.branchId;
  if (query.program) filter.program = new RegExp(`^${escapeRegExp(query.program)}`, 'i');
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }, { registrationNumber: rx }, { cnic: rx }];
  }

  const [data, totalItems] = await Promise.all([
    Student.find(filter)
      .populate('selectedBranch', 'name code city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function getStudent(id) {
  const student = await Student.findById(id).populate('selectedBranch', 'name code city address contactNumber');
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  return student;
}

async function assertUnique(payload, excludeId = null) {
  const checks = [];
  if (payload.email) checks.push({ email: payload.email.toLowerCase() });
  if (payload.registrationNumber) checks.push({ registrationNumber: payload.registrationNumber.toUpperCase() });
  if (payload.cnic) checks.push({ cnic: payload.cnic });

  for (const condition of checks) {
    const query = { ...condition };
    if (excludeId) query._id = { $ne: excludeId };
    const found = await Student.findOne(query).select('_id');
    if (found) {
      const field = Object.keys(condition)[0];
      throw ApiError.conflict(`A student with this ${field} already exists.`, 'DUPLICATE_STUDENT', {
        field,
      });
    }
  }
}

export async function createStudent(payload) {
  const normalized = {
    ...payload,
    email: payload.email.toLowerCase().trim(),
    registrationNumber: payload.registrationNumber.toUpperCase().trim(),
    accountStatus: ACCOUNT_STATUS.PENDING_SETUP,
  };
  await assertUnique(normalized);

  const student = await Student.create(normalized);
  const setup = await issueSetupTokenAndSend(student);
  return { student: student.toJSON(), setup };
}

const ACCOUNT_FIELDS = new Set([
  'accountStatus',
  'emailStatus',
  'emailLastError',
  'emailLastAttemptAt',
  'passwordHash',
  'setupTokenHash',
  'setupTokenExpiresAt',
  'resetTokenHash',
  'resetTokenExpiresAt',
  'role',
  'selectedBranch',
  'branchSelectedAt',
  'dateSheetLocked',
]);
const WORKFLOW_FIELDS = new Set(['branchChangeEntitlement', 'dateSheetChangeEntitlement']);

export async function updateStudent(id, payload) {
  const student = await Student.findById(id);
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');

  await assertUnique(payload, id);

  for (const [key, value] of Object.entries(payload)) {
    if (ACCOUNT_FIELDS.has(key) || WORKFLOW_FIELDS.has(key)) continue; // never mass-assign
    if (key === 'guardian') {
      student.guardian = { ...student.guardian.toObject?.() ?? student.guardian, ...value };
    } else if (value !== undefined) {
      student[key] = key === 'registrationNumber' ? value.toUpperCase() : value;
    }
  }
  await student.save();
  return student;
}

export async function studentDependencies(id) {
  const [assignments, dateSheet, requests] = await Promise.all([
    CourseAssignment.countDocuments({ student: id }),
    DateSheet.countDocuments({ student: id }),
    ChangeRequest.countDocuments({ student: id }),
  ]);
  return { assignments, dateSheet, requests, total: assignments + dateSheet + requests };
}

/**
 * Deletes a student only when fully unreferenced; otherwise safely deactivates
 * the account so historical records remain intact.
 */
export async function deleteStudent(id) {
  const student = await Student.findById(id);
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');

  const deps = await studentDependencies(id);
  if (deps.total > 0) {
    student.isActive = false;
    student.accountStatus = ACCOUNT_STATUS.DISABLED;
    await student.save();
    return { deleted: false, deactivated: true, dependencies: deps };
  }
  await student.deleteOne();
  return { deleted: true, deactivated: false };
}

export async function setStudentActive(id, isActive) {
  const student = await Student.findById(id);
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  student.isActive = isActive;
  if (!isActive) student.accountStatus = ACCOUNT_STATUS.DISABLED;
  else if (student.passwordHash) student.accountStatus = ACCOUNT_STATUS.ACTIVE;
  else student.accountStatus = ACCOUNT_STATUS.PENDING_SETUP;
  await student.save();
  return student;
}

export async function resendSetupEmail(id) {
  const student = await Student.findById(id).select('+setupTokenHash +setupTokenExpiresAt');
  if (!student) throw ApiError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  if (student.passwordHash) {
    throw ApiError.badRequest('This student has already completed account setup.', 'SETUP_ALREADY_COMPLETE');
  }
  const setup = await issueSetupTokenAndSend(student, { resend: true });
  return { setup, emailStatus: setup.emailStatus || EMAIL_STATUS.PENDING };
}

export default {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  setStudentActive,
  resendSetupEmail,
  studentDependencies,
};

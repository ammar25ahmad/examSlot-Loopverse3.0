import ChangeRequest from '../models/ChangeRequest.js';
import Student from '../models/Student.js';
import DateSheet from '../models/DateSheet.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_STATUS, REQUEST_STATUS, REQUEST_TYPE } from '../config/constants.js';
import { buildPaginationMeta, escapeRegExp, parsePagination } from '../utils/pagination.js';
import { sendRequestReviewedEmail } from './emailService.js';

const STUDENT_FIELDS = 'fullName registrationNumber email program semester accountStatus';

export async function createRequest(student, { type, reason }) {
  if (type === REQUEST_TYPE.BRANCH_CHANGE && !student.selectedBranch) {
    throw ApiError.badRequest('Select an examination branch before requesting a change.', 'NO_BRANCH');
  }
  if (type === REQUEST_TYPE.DATE_SHEET_CHANGE) {
    const sheet = await DateSheet.exists({ student: student._id });
    if (!sheet) {
      throw ApiError.badRequest('Create and save a date sheet before requesting a change.', 'NO_DATE_SHEET');
    }
  }

  const pending = await ChangeRequest.findOne({
    student: student._id,
    type,
    status: REQUEST_STATUS.PENDING,
  });
  if (pending) {
    throw ApiError.conflict('You already have a pending request of this type.', 'PENDING_REQUEST_EXISTS');
  }

  try {
    const request = await ChangeRequest.create({ student: student._id, type, reason });
    return request;
  } catch (err) {
    if (err?.code === 11000) {
      throw ApiError.conflict('You already have a pending request of this type.', 'PENDING_REQUEST_EXISTS');
    }
    throw err;
  }
}

export async function listStudentRequests(student, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { student: student._id };
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  const [data, totalItems] = await Promise.all([
    ChangeRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ChangeRequest.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function listAllRequests(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    const students = await Student.find({ $or: [{ fullName: rx }, { registrationNumber: rx }] })
      .select('_id')
      .lean();
    filter.student = { $in: students.map((s) => s._id) };
  }

  const [data, totalItems] = await Promise.all([
    ChangeRequest.find(filter)
      .populate('student', STUDENT_FIELDS)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ChangeRequest.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function reviewRequest(id, { status, adminRemark = '' }, admin) {
  if (![REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED].includes(status)) {
    throw ApiError.badRequest('Status must be APPROVED or REJECTED.', 'INVALID_STATUS');
  }

  // Atomic single transition: guarantees a request can only be reviewed once,
  // even under concurrent/replayed admin actions.
  const request = await ChangeRequest.findOneAndUpdate(
    { _id: id, status: REQUEST_STATUS.PENDING },
    {
      $set: {
        status,
        adminRemark: adminRemark || '',
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
    },
    { new: true }
  ).populate('student', STUDENT_FIELDS);

  if (!request) {
    throw ApiError.conflict('This request has already been reviewed.', 'ALREADY_REVIEWED');
  }

  let entitlementGranted = null;
  if (status === REQUEST_STATUS.APPROVED) {
    const field =
      request.type === REQUEST_TYPE.BRANCH_CHANGE ? 'branchChangeEntitlement' : 'dateSheetChangeEntitlement';
    await Student.updateOne({ _id: request.student._id }, { $set: { [field]: true } });
    entitlementGranted = field;
  }

  // Notify the student (best-effort — never blocks the review).
  let emailStatus = 'SKIPPED';
  try {
    const studentDoc = await Student.findById(request.student._id);
    if (studentDoc) {
      const result = await sendRequestReviewedEmail({
        student: studentDoc,
        request,
        approved: status === REQUEST_STATUS.APPROVED,
        remark: adminRemark,
      });
      emailStatus = result.status;
    }
  } catch {
    emailStatus = 'FAILED';
  }

  await AdminAuditLog.create({
    actor: admin._id,
    actorEmail: admin.email,
    action: 'REQUEST_REVIEWED',
    entityType: 'ChangeRequest',
    entityId: String(request._id),
    description: `${request.type} ${status}`,
    metadata: { type: request.type, status, entitlementGranted },
  });

  return { request, entitlementGranted, emailStatus };
}

export async function pendingCounts() {
  const rows = await ChangeRequest.aggregate([
    { $match: { status: REQUEST_STATUS.PENDING } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const result = { [REQUEST_TYPE.BRANCH_CHANGE]: 0, [REQUEST_TYPE.DATE_SHEET_CHANGE]: 0, total: 0 };
  for (const row of rows) {
    result[row._id] = row.count;
    result.total += row.count;
  }
  return result;
}

export default { createRequest, listStudentRequests, listAllRequests, reviewRequest, pendingCounts };

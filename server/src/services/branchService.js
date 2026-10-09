import Branch from '../models/Branch.js';
import Student from '../models/Student.js';
import DateSheet from '../models/DateSheet.js';
import ApiError from '../utils/ApiError.js';
import { buildPaginationMeta, escapeRegExp, parsePagination } from '../utils/pagination.js';

export async function listBranches(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status === 'active') filter.isActive = true;
  else if (query.status === 'inactive') filter.isActive = false;
  if (query.city) filter.city = new RegExp(`^${escapeRegExp(query.city)}`, 'i');
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$or = [{ name: rx }, { code: rx }, { city: rx }, { address: rx }];
  }

  const [data, totalItems] = await Promise.all([
    Branch.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Branch.countDocuments(filter),
  ]);

  return { data, pagination: buildPaginationMeta({ page, limit, totalItems }) };
}

export async function getBranch(id) {
  const branch = await Branch.findById(id);
  if (!branch) throw ApiError.notFound('Branch not found', 'BRANCH_NOT_FOUND');
  return branch;
}

export async function createBranch(payload) {
  const existing = await Branch.findOne({ code: payload.code.toUpperCase() });
  if (existing) throw ApiError.conflict('A branch with this code already exists.', 'DUPLICATE_BRANCH_CODE');
  return Branch.create(payload);
}

const UPDATABLE = ['name', 'code', 'city', 'address', 'contactNumber', 'seatCapacity', 'isActive'];

export async function updateBranch(id, payload) {
  const branch = await Branch.findById(id);
  if (!branch) throw ApiError.notFound('Branch not found', 'BRANCH_NOT_FOUND');

  if (payload.code && payload.code.toUpperCase() !== branch.code) {
    const dup = await Branch.findOne({ code: payload.code.toUpperCase(), _id: { $ne: branch._id } });
    if (dup) throw ApiError.conflict('A branch with this code already exists.', 'DUPLICATE_BRANCH_CODE');
  }

  for (const key of UPDATABLE) {
    if (payload[key] !== undefined) branch[key] = payload[key];
  }
  await branch.save();
  return branch;
}

export async function branchDependencies(id) {
  const [students, dateSheets] = await Promise.all([
    Student.countDocuments({ selectedBranch: id }),
    DateSheet.countDocuments({ branch: id }),
  ]);
  return { students, dateSheets, total: students + dateSheets };
}

/**
 * Hard delete is refused when the branch is referenced. Administrators are
 * steered to deactivate instead, preserving existing students/date sheets.
 */
export async function deleteBranch(id) {
  const branch = await Branch.findById(id);
  if (!branch) throw ApiError.notFound('Branch not found', 'BRANCH_NOT_FOUND');

  const deps = await branchDependencies(id);
  if (deps.total > 0) {
    throw ApiError.conflict(
      `This branch is used by ${deps.students} student(s) and ${deps.dateSheets} date sheet(s). Deactivate it instead of deleting.`,
      'BRANCH_IN_USE'
    );
  }
  await branch.deleteOne();
  return { deleted: true };
}

export default {
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  branchDependencies,
};

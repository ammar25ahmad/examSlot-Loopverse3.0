import * as branchService from '../services/branchService.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTION } from '../config/constants.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  const { data, pagination } = await branchService.listBranches(req.query);
  return sendPaginated(res, data, pagination);
}

export async function get(req, res) {
  const branch = await branchService.getBranch(req.params.id);
  return sendSuccess(res, branch);
}

export async function create(req, res) {
  const branch = await branchService.createBranch(req.body);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.BRANCH_CREATED,
    entityType: 'Branch',
    entityId: branch._id,
    description: `Created branch ${branch.code}`,
    req,
  });
  return sendCreated(res, branch);
}

export async function update(req, res) {
  const branch = await branchService.updateBranch(req.params.id, req.body);
  const deactivated = req.body.isActive === false;
  await recordAudit({
    actor: req.admin,
    action: deactivated ? AUDIT_ACTION.BRANCH_DEACTIVATED : AUDIT_ACTION.BRANCH_UPDATED,
    entityType: 'Branch',
    entityId: branch._id,
    description: `${deactivated ? 'Deactivated' : 'Updated'} branch ${branch.code}`,
    req,
  });
  return sendSuccess(res, branch);
}

export async function remove(req, res) {
  const result = await branchService.deleteBranch(req.params.id);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.BRANCH_DEACTIVATED,
    entityType: 'Branch',
    entityId: req.params.id,
    description: 'Deleted unused branch',
    req,
  });
  return sendSuccess(res, result);
}

export async function dependencies(req, res) {
  const deps = await branchService.branchDependencies(req.params.id);
  return sendSuccess(res, deps);
}

export default { list, get, create, update, remove, dependencies };

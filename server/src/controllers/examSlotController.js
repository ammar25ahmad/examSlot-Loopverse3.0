import * as examSlotService from '../services/examSlotService.js';
import { recordAudit } from '../services/auditService.js';
import { AUDIT_ACTION } from '../config/constants.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  const { data, pagination } = await examSlotService.listExamSlots(req.query);
  return sendPaginated(res, data, pagination);
}

export async function get(req, res) {
  const slot = await examSlotService.getExamSlot(req.params.id);
  return sendSuccess(res, slot);
}

export async function create(req, res) {
  const slot = await examSlotService.createExamSlot(req.body);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.SLOT_CREATED,
    entityType: 'ExamSlot',
    entityId: slot._id,
    description: `Created exam slot on ${slot.examDate} ${slot.startTime}`,
    req,
  });
  return sendCreated(res, slot);
}

export async function update(req, res) {
  const slot = await examSlotService.updateExamSlot(req.params.id, req.body);
  const deactivated = req.body.isActive === false;
  await recordAudit({
    actor: req.admin,
    action: deactivated ? AUDIT_ACTION.SLOT_DEACTIVATED : AUDIT_ACTION.SLOT_UPDATED,
    entityType: 'ExamSlot',
    entityId: slot._id,
    description: `${deactivated ? 'Deactivated' : 'Updated'} exam slot`,
    req,
  });
  return sendSuccess(res, slot);
}

export async function remove(req, res) {
  const result = await examSlotService.deleteExamSlot(req.params.id);
  await recordAudit({
    actor: req.admin,
    action: AUDIT_ACTION.SLOT_DEACTIVATED,
    entityType: 'ExamSlot',
    entityId: req.params.id,
    description: 'Deleted exam slot',
    req,
  });
  return sendSuccess(res, result);
}

export async function dependencies(req, res) {
  const deps = await examSlotService.slotDependencies(req.params.id);
  return sendSuccess(res, deps);
}

export default { list, get, create, update, remove, dependencies };

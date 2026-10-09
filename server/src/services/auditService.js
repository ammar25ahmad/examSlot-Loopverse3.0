import AdminAuditLog from '../models/AdminAuditLog.js';
import logger from '../utils/logger.js';

/**
 * Records an administrative action. Metadata must never contain passwords,
 * tokens, or other secrets. Failures here never break the main flow.
 */
export async function recordAudit({ actor, action, entityType = '', entityId = '', description = '', metadata = {}, req }) {
  try {
    await AdminAuditLog.create({
      actor: actor?._id || actor || null,
      actorEmail: actor?.email || '',
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      description,
      metadata,
      ip: req?.ip || '',
    });
  } catch (err) {
    logger.warn('Audit log write failed:', err.message);
  }
}

export default { recordAudit };

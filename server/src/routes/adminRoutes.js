import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as requestController from '../controllers/requestController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { reviewRequestSchema } from '../validators/requestValidators.js';
import { requestListQuery, auditLogQuery } from '../validators/listQueries.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', asyncHandler(adminController.dashboard));
router.get('/audit-logs', validate(auditLogQuery, 'query'), asyncHandler(adminController.listAuditLogs));

router.get('/requests', validate(requestListQuery, 'query'), asyncHandler(requestController.adminList));
router.get('/requests/pending-summary', asyncHandler(requestController.pendingSummary));
router.patch(
  '/requests/:id/review',
  validateObjectId('id'),
  validate(reviewRequestSchema),
  asyncHandler(requestController.adminReview)
);

export default router;

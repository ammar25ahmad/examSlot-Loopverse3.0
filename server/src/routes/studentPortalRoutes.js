import { Router } from 'express';
import { z } from 'zod';
import * as portal from '../controllers/studentPortalController.js';
import * as requestController from '../controllers/requestController.js';
import { authenticate, requireStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { objectId } from '../validators/common.js';
import { createRequestSchema } from '../validators/requestValidators.js';
import { saveDateSheetSchema } from '../validators/dateSheetValidators.js';
import { requestListQuery } from '../validators/listQueries.js';
import { requestLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireStudent);

const selectBranchSchema = z.object({ branchId: objectId }).strict();

router.get('/dashboard', asyncHandler(portal.dashboard));
router.get('/profile', asyncHandler(portal.profile));
router.get('/branches', asyncHandler(portal.branches));
router.post('/select-branch', validate(selectBranchSchema), asyncHandler(portal.selectBranch));
router.get('/assignments', asyncHandler(portal.assignments));
router.get('/exam-slots', asyncHandler(portal.examSlots));

router.get('/date-sheet', asyncHandler(portal.getDateSheet));
router.get('/date-sheet/builder', asyncHandler(portal.builder));
router.get('/date-sheet/pdf', asyncHandler(portal.downloadPdf));
router.post('/date-sheet', validate(saveDateSheetSchema), asyncHandler(portal.saveDateSheet));
router.patch('/date-sheet', validate(saveDateSheetSchema), asyncHandler(portal.updateDateSheet));

router.get('/requests', validate(requestListQuery, 'query'), asyncHandler(requestController.studentList));
router.post('/requests', requestLimiter, validate(createRequestSchema), asyncHandler(requestController.studentCreate));

export default router;

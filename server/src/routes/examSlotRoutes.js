import { Router } from 'express';
import * as examSlotController from '../controllers/examSlotController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createSlotSchema, updateSlotSchema } from '../validators/examSlotValidators.js';
import { examSlotListQuery } from '../validators/listQueries.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', validate(examSlotListQuery, 'query'), asyncHandler(examSlotController.list));
router.get('/:id', validateObjectId('id'), asyncHandler(examSlotController.get));
router.get('/:id/dependencies', validateObjectId('id'), asyncHandler(examSlotController.dependencies));
router.post('/', validate(createSlotSchema), asyncHandler(examSlotController.create));
router.patch('/:id', validateObjectId('id'), validate(updateSlotSchema), asyncHandler(examSlotController.update));
router.delete('/:id', validateObjectId('id'), asyncHandler(examSlotController.remove));

export default router;

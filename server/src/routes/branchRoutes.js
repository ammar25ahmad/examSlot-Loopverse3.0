import { Router } from 'express';
import * as branchController from '../controllers/branchController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createBranchSchema, updateBranchSchema } from '../validators/branchValidators.js';
import { branchListQuery } from '../validators/listQueries.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', validate(branchListQuery, 'query'), asyncHandler(branchController.list));
router.get('/:id', validateObjectId('id'), asyncHandler(branchController.get));
router.get('/:id/dependencies', validateObjectId('id'), asyncHandler(branchController.dependencies));
router.post('/', validate(createBranchSchema), asyncHandler(branchController.create));
router.patch('/:id', validateObjectId('id'), validate(updateBranchSchema), asyncHandler(branchController.update));
router.delete('/:id', validateObjectId('id'), asyncHandler(branchController.remove));

export default router;

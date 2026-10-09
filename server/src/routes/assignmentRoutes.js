import { Router } from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import {
  createAssignmentSchema,
  setAssignmentsSchema,
} from '../validators/assignmentValidators.js';
import { assignmentListQuery } from '../validators/listQueries.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', validate(assignmentListQuery, 'query'), asyncHandler(assignmentController.list));
router.get('/student/:studentId', validateObjectId('studentId'), asyncHandler(assignmentController.listForStudent));
router.put(
  '/student/:studentId',
  validateObjectId('studentId'),
  validate(setAssignmentsSchema),
  asyncHandler(assignmentController.setForStudent)
);
router.post('/', validate(createAssignmentSchema), asyncHandler(assignmentController.create));
router.patch('/:id', validateObjectId('id'), asyncHandler(assignmentController.update));
router.delete('/:id', validateObjectId('id'), asyncHandler(assignmentController.remove));

export default router;

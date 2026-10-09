import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createCourseSchema, updateCourseSchema } from '../validators/courseValidators.js';
import { courseListQuery } from '../validators/listQueries.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', validate(courseListQuery, 'query'), asyncHandler(courseController.list));
router.get('/:id', validateObjectId('id'), asyncHandler(courseController.get));
router.get('/:id/dependencies', validateObjectId('id'), asyncHandler(courseController.dependencies));
router.post('/', validate(createCourseSchema), asyncHandler(courseController.create));
router.patch('/:id', validateObjectId('id'), validate(updateCourseSchema), asyncHandler(courseController.update));
router.delete('/:id', validateObjectId('id'), asyncHandler(courseController.remove));

export default router;

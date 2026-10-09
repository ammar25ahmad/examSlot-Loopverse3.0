import { Router } from 'express';
import { z } from 'zod';
import * as studentController from '../controllers/studentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createStudentSchema, updateStudentSchema } from '../validators/studentValidators.js';
import { studentListQuery } from '../validators/listQueries.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);

const activeSchema = z.object({ isActive: z.boolean() }).strict();

router.get('/', validate(studentListQuery, 'query'), asyncHandler(studentController.list));
router.get('/:id', validateObjectId('id'), asyncHandler(studentController.get));
router.get('/:id/dependencies', validateObjectId('id'), asyncHandler(studentController.dependencies));
router.post('/', validate(createStudentSchema), asyncHandler(studentController.create));
router.patch('/:id', validateObjectId('id'), validate(updateStudentSchema), asyncHandler(studentController.update));
router.patch('/:id/status', validateObjectId('id'), validate(activeSchema), asyncHandler(studentController.setActive));
router.post('/:id/resend-setup-email', validateObjectId('id'), asyncHandler(studentController.resendSetup));
router.delete('/:id', validateObjectId('id'), asyncHandler(studentController.remove));

export default router;

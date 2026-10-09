import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, passwordLimiter } from '../middleware/rateLimit.js';
import {
  loginSchema,
  forgotPasswordSchema,
  setPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));
router.get('/csrf', asyncHandler(authController.csrf));
router.post(
  '/forgot-password',
  passwordLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post(
  '/set-password',
  passwordLimiter,
  validate(setPasswordSchema),
  asyncHandler(authController.setPassword)
);
router.post(
  '/reset-password',
  passwordLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

export default router;

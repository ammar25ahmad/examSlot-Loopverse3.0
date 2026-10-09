import { z } from 'zod';
import { password } from './common.js';

export const loginSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    expectedRole: z.enum(['admin', 'student']).optional(),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({ email: z.string().trim().email('Enter a valid email address') })
  .strict();

export const setPasswordSchema = z
  .object({
    token: z.string().min(10, 'Setup token is missing'),
    password,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Reset token is missing'),
    password,
  })
  .strict();

export default { loginSchema, forgotPasswordSchema, setPasswordSchema, resetPasswordSchema };

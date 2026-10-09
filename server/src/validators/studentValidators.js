import { z } from 'zod';
import { phone } from './common.js';

const guardianSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    cnic: z.string().trim().min(5).max(20),
    occupation: z.string().trim().min(2).max(120),
    contactNumber: phone,
    emergencyContact: phone,
  })
  .strict();

export const studentBody = {
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  phone,
  cnic: z.string().trim().min(5).max(20),
  dateOfBirth: z.coerce.date({
    errorMap: () => ({ message: 'Enter a valid date of birth' }),
  }),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().trim().min(3).max(300),
  photoUrl: z.string().trim().url('Enter a valid URL').or(z.literal('')).optional(),
  guardian: guardianSchema,
  registrationNumber: z.string().trim().min(2).max(40),
  program: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(16),
  session: z.string().trim().min(2).max(40),
  previousQualification: z.string().trim().min(2).max(160),
  previousInstitute: z.string().trim().min(2).max(200),
  marks: z.string().trim().min(1).max(60),
};

export const createStudentSchema = z.object(studentBody).strict();

export const updateStudentSchema = z
  .object({ ...studentBody, isActive: z.boolean(), guardian: guardianSchema.partial().optional() })
  .partial()
  .strict();

export default { createStudentSchema, updateStudentSchema };

import { z } from 'zod';

export const courseBody = {
  code: z.string().trim().min(2).max(20),
  title: z.string().trim().min(2).max(200),
  creditHours: z.coerce.number().int().min(1).max(12),
  department: z.string().trim().min(2).max(120),
  isActive: z.boolean().optional(),
};

export const createCourseSchema = z.object(courseBody).strict();
export const updateCourseSchema = z.object(courseBody).partial().strict();

export default { createCourseSchema, updateCourseSchema };

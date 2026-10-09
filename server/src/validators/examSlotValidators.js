import { z } from 'zod';
import { dateOnly, objectId, timeOnly } from './common.js';

export const slotBody = {
  course: objectId,
  examDate: dateOnly,
  startTime: timeOnly,
  endTime: timeOnly.or(z.literal('')).optional(),
  capacity: z.record(objectId, z.coerce.number().int().min(0).max(10000)).optional(),
  isActive: z.boolean().optional(),
};

export const createSlotSchema = z.object(slotBody).strict();
export const updateSlotSchema = z.object(slotBody).partial().strict();

export const studentSlotsQuery = z
  .object({ courseId: objectId.optional() })
  .passthrough();

export default { createSlotSchema, updateSlotSchema, studentSlotsQuery };

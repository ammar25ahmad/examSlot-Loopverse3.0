import { z } from 'zod';
import { objectId } from './common.js';
import { ASSIGNMENT_MAX, ASSIGNMENT_MIN } from '../config/constants.js';

export const createAssignmentSchema = z
  .object({ student: objectId, course: objectId })
  .strict();

export const updateAssignmentSchema = z.object({ course: objectId }).strict();

export const setAssignmentsSchema = z
  .object({
    courseIds: z
      .array(objectId)
      .min(ASSIGNMENT_MIN, `Select at least ${ASSIGNMENT_MIN} courses`)
      .max(ASSIGNMENT_MAX, `Select at most ${ASSIGNMENT_MAX} courses`)
      .refine((ids) => new Set(ids).size === ids.length, 'Duplicate courses are not allowed'),
  })
  .strict();

export default { createAssignmentSchema, updateAssignmentSchema, setAssignmentsSchema };

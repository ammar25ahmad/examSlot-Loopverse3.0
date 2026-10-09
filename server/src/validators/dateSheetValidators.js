import { z } from 'zod';
import { objectId } from './common.js';
import { ASSIGNMENT_MIN, ASSIGNMENT_MAX } from '../config/constants.js';

export const saveDateSheetSchema = z
  .object({
    selections: z
      .array(z.object({ course: objectId, slot: objectId }).strict())
      .min(ASSIGNMENT_MIN, 'Select exam slots for all assigned courses')
      .max(ASSIGNMENT_MAX, 'You can select at most six exam slots'),
  })
  .strict();

export default { saveDateSheetSchema };

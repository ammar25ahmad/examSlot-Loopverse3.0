import { z } from 'zod';
import { objectId } from './common.js';
import { REQUEST_STATUS, REQUEST_TYPE } from '../config/constants.js';

export const createRequestSchema = z
  .object({
    type: z.enum([REQUEST_TYPE.BRANCH_CHANGE, REQUEST_TYPE.DATE_SHEET_CHANGE]),
    reason: z.string().trim().min(10, 'Please provide a reason (at least 10 characters)').max(1000),
  })
  .strict();

export const reviewRequestSchema = z
  .object({
    status: z.enum([REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED]),
    adminRemark: z.string().trim().max(1000).optional().default(''),
  })
  .strict();

export const reviewParamsSchema = z.object({ id: objectId });

export default { createRequestSchema, reviewRequestSchema, reviewParamsSchema };

import { z } from 'zod';
import { phone } from './common.js';

export const branchBody = {
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(300),
  contactNumber: phone,
  seatCapacity: z.coerce.number().int().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
};

export const createBranchSchema = z.object(branchBody).strict();
export const updateBranchSchema = z.object(branchBody).partial().strict();

export default { createBranchSchema, updateBranchSchema };

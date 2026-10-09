import { z } from 'zod';
import { dateOnly, objectId } from './common.js';

const page = z.coerce.number().int().positive().optional();
const limit = z.coerce.number().int().positive().max(100).optional();
const search = z.string().trim().max(120).optional();

export const branchListQuery = z.object({
  page,
  limit,
  search,
  status: z.enum(['active', 'inactive']).optional(),
  city: z.string().trim().max(100).optional(),
});

export const courseListQuery = z.object({
  page,
  limit,
  search,
  status: z.enum(['active', 'inactive']).optional(),
  department: z.string().trim().max(120).optional(),
});

export const studentListQuery = z.object({
  page,
  limit,
  search,
  status: z.enum(['active', 'inactive']).optional(),
  accountStatus: z.enum(['PENDING_SETUP', 'ACTIVE', 'DISABLED']).optional(),
  branchId: objectId.optional(),
  program: z.string().trim().max(120).optional(),
});

export const assignmentListQuery = z.object({
  page,
  limit,
  search,
  studentId: objectId.optional(),
  courseId: objectId.optional(),
});

export const examSlotListQuery = z.object({
  page,
  limit,
  search,
  courseId: objectId.optional(),
  status: z.enum(['active', 'inactive']).optional(),
  date: dateOnly.optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
});

export const requestListQuery = z.object({
  page,
  limit,
  search,
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  type: z.enum(['BRANCH_CHANGE', 'DATE_SHEET_CHANGE']).optional(),
});

export const auditLogQuery = z.object({
  page,
  limit,
  action: z.string().trim().max(60).optional(),
});

export default {
  branchListQuery,
  courseListQuery,
  studentListQuery,
  assignmentListQuery,
  examSlotListQuery,
  requestListQuery,
  auditLogQuery,
};

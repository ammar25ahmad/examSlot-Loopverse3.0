import * as dashboardService from '../services/dashboardService.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { sendPaginated, sendSuccess } from '../utils/response.js';

export async function dashboard(_req, res) {
  const data = await dashboardService.getDashboard();
  return sendSuccess(res, data);
}

export async function listAuditLogs(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;

  const [data, totalItems] = await Promise.all([
    AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'name email').lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  return sendPaginated(res, data, buildPaginationMeta({ page, limit, totalItems }));
}

export default { dashboard, listAuditLogs };

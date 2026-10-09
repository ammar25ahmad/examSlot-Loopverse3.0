import * as requestService from '../services/requestService.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response.js';

export async function studentList(req, res) {
  const { data, pagination } = await requestService.listStudentRequests(req.student, req.query);
  return sendPaginated(res, data, pagination);
}

export async function studentCreate(req, res) {
  const request = await requestService.createRequest(req.student, req.body);
  return sendCreated(res, request);
}

export async function adminList(req, res) {
  const { data, pagination } = await requestService.listAllRequests(req.query);
  return sendPaginated(res, data, pagination);
}

export async function adminReview(req, res) {
  const result = await requestService.reviewRequest(req.params.id, req.body, req.admin);
  return sendSuccess(res, result);
}

export async function pendingSummary(_req, res) {
  const counts = await requestService.pendingCounts();
  return sendSuccess(res, counts);
}

export { parsePagination, buildPaginationMeta };

export default { studentList, studentCreate, adminList, adminReview, pendingSummary };

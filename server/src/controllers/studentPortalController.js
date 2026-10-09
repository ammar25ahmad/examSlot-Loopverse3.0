import * as workflow from '../services/studentWorkflowService.js';
import * as dateSheetService from '../services/dateSheetService.js';
import * as assignmentService from '../services/assignmentService.js';
import { slotsForCourses } from '../services/examSlotService.js';
import { streamDateSheetPdf } from '../services/pdfService.js';
import DateSheet from '../models/DateSheet.js';
import Branch from '../models/Branch.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export async function dashboard(req, res) {
  const data = await workflow.getDashboard(req.student);
  return sendSuccess(res, data);
}

export async function profile(req, res) {
  const data = await workflow.getProfile(req.student);
  return sendSuccess(res, data);
}

export async function branches(_req, res) {
  const data = await workflow.listActiveBranches();
  return sendSuccess(res, data);
}

export async function selectBranch(req, res) {
  const result = await workflow.selectBranch(req.student, req.body.branchId);
  return sendSuccess(res, result);
}

export async function assignments(req, res) {
  const result = await assignmentService.getStudentAssignments(req.student._id);
  return sendSuccess(res, result);
}

export async function examSlots(req, res) {
  const assignments = await assignmentService.getStudentAssignments(req.student._id);
  const courseIds = assignments.assignments.map((a) => a.course?._id || a.course);
  const branch = req.student.selectedBranch
    ? await Branch.findById(req.student.selectedBranch).lean()
    : null;
  const slots = await slotsForCourses(courseIds, branch, { excludeFull: false });
  return sendSuccess(res, { branch, slots });
}

export async function builder(req, res) {
  const data = await dateSheetService.getBuilderData(req.student);
  return sendSuccess(res, data);
}

export async function getDateSheet(req, res) {
  const sheet = await dateSheetService.getDateSheet(req.student);
  return sendSuccess(res, sheet);
}

export async function saveDateSheet(req, res) {
  const sheet = await dateSheetService.saveDateSheet(req.student, req.body.selections);
  return sendSuccess(res, sheet, 201);
}

export async function updateDateSheet(req, res) {
  const sheet = await dateSheetService.saveDateSheet(req.student, req.body.selections);
  return sendSuccess(res, sheet);
}

export async function downloadPdf(req, res) {
  const sheet = await dateSheetService.getDateSheet(req.student);
  if (!sheet) throw ApiError.notFound('No saved date sheet found.', 'NO_DATE_SHEET');
  const raw = await DateSheet.findById(sheet._id).lean();
  return streamDateSheetPdf(res, {
    student: req.student,
    branch: sheet.branch,
    dateSheet: raw,
  });
}

export default {
  dashboard,
  profile,
  branches,
  selectBranch,
  assignments,
  examSlots,
  builder,
  getDateSheet,
  saveDateSheet,
  updateDateSheet,
  downloadPdf,
};

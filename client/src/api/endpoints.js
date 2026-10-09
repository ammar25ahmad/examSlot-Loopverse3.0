import api from './client.js';
import { baseURL } from './client.js';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  setPassword: (payload) => api.post('/auth/set-password', payload),
};

export const branchesApi = {
  list: (params) => api.get('/branches', { params }),
  get: (id) => api.get(`/branches/${id}`),
  create: (payload) => api.post('/branches', payload),
  update: (id, payload) => api.patch(`/branches/${id}`, payload),
  remove: (id) => api.delete(`/branches/${id}`),
  dependencies: (id) => api.get(`/branches/${id}/dependencies`),
};

export const coursesApi = {
  list: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (payload) => api.post('/courses', payload),
  update: (id, payload) => api.patch(`/courses/${id}`, payload),
  remove: (id) => api.delete(`/courses/${id}`),
  dependencies: (id) => api.get(`/courses/${id}/dependencies`),
};

export const studentsApi = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (payload) => api.post('/students', payload),
  update: (id, payload) => api.patch(`/students/${id}`, payload),
  remove: (id) => api.delete(`/students/${id}`),
  setStatus: (id, isActive) => api.patch(`/students/${id}/status`, { isActive }),
  resendSetup: (id) => api.post(`/students/${id}/resend-setup-email`),
  dependencies: (id) => api.get(`/students/${id}/dependencies`),
};

export const assignmentsApi = {
  list: (params) => api.get('/assignments', { params }),
  forStudent: (studentId) => api.get(`/assignments/student/${studentId}`),
  setForStudent: (studentId, courseIds) => api.put(`/assignments/student/${studentId}`, { courseIds }),
  create: (payload) => api.post('/assignments', payload),
  remove: (id) => api.delete(`/assignments/${id}`),
};

export const examSlotsApi = {
  list: (params) => api.get('/exam-slots', { params }),
  get: (id) => api.get(`/exam-slots/${id}`),
  create: (payload) => api.post('/exam-slots', payload),
  update: (id, payload) => api.patch(`/exam-slots/${id}`, payload),
  remove: (id) => api.delete(`/exam-slots/${id}`),
  dependencies: (id) => api.get(`/exam-slots/${id}/dependencies`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  requests: (params) => api.get('/admin/requests', { params }),
  reviewRequest: (id, payload) => api.patch(`/admin/requests/${id}/review`, payload),
};

export const studentApi = {
  dashboard: () => api.get('/student/dashboard'),
  profile: () => api.get('/student/profile'),
  branches: () => api.get('/student/branches'),
  selectBranch: (branchId) => api.post('/student/select-branch', { branchId }),
  assignments: () => api.get('/student/assignments'),
  examSlots: (params) => api.get('/student/exam-slots', { params }),
  builder: () => api.get('/student/date-sheet/builder'),
  dateSheet: () => api.get('/student/date-sheet'),
  saveDateSheet: (selections) => api.post('/student/date-sheet', { selections }),
  updateDateSheet: (selections) => api.patch('/student/date-sheet', { selections }),
  pdfUrl: () => `${baseURL}/student/date-sheet/pdf`,
  requests: (params) => api.get('/student/requests', { params }),
  createRequest: (payload) => api.post('/student/requests', payload),
};

export default {
  authApi,
  branchesApi,
  coursesApi,
  studentsApi,
  assignmentsApi,
  examSlotsApi,
  adminApi,
  studentApi,
};

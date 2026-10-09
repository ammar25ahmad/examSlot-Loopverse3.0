import * as authService from '../services/authService.js';
import { setAuthCookie, clearAuthCookie, issueCsrfToken, clearCsrfToken } from '../utils/cookies.js';
import { sendSuccess } from '../utils/response.js';
import { ACCOUNT_STATUS } from '../config/constants.js';

export async function login(req, res) {
  const { email, password, expectedRole } = req.body;
  const { token, user, role } = await authService.login({ email, password, expectedRole });
  setAuthCookie(res, token);
  const csrfToken = issueCsrfToken(res);
  const payloadUser =
    role === 'student'
      ? {
          ...user,
          hasSelectedBranch: Boolean(user.selectedBranch),
          setupRequired: user.accountStatus === ACCOUNT_STATUS.PENDING_SETUP,
        }
      : user;
  return sendSuccess(res, { user: payloadUser, role, csrfToken });
}

export async function logout(_req, res) {
  clearAuthCookie(res);
  clearCsrfToken(res);
  return sendSuccess(res, { message: 'Signed out.' });
}

export async function me(req, res) {
  const csrfToken = issueCsrfToken(res);
  if (req.admin) {
    return sendSuccess(res, { role: 'admin', user: req.admin.toJSON(), csrfToken });
  }
  const student = req.student;
  return sendSuccess(res, {
    role: 'student',
    csrfToken,
    user: {
      ...student.toJSON(),
      hasSelectedBranch: Boolean(student.selectedBranch),
      setupRequired: student.accountStatus === ACCOUNT_STATUS.PENDING_SETUP,
    },
  });
}

export async function csrf(_req, res) {
  const csrfToken = issueCsrfToken(res);
  return sendSuccess(res, { csrfToken });
}

export async function setPassword(req, res) {
  const student = await authService.setPassword(req.body);
  return sendSuccess(res, { message: 'Password set successfully. You can now sign in.', user: student });
}

export async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.body);
  return sendSuccess(res, result);
}

export async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, result);
}

export default { login, logout, me, csrf, setPassword, forgotPassword, resetPassword };

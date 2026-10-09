import crypto from 'node:crypto';
import env from '../config/env.js';

export const AUTH_COOKIE = 'examslot_token';
export const CSRF_COOKIE = 'examslot_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const baseCookieOptions = {
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
};

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { ...baseCookieOptions, httpOnly: true });
}

/** Issues a CSRF token readable by the browser (double-submit cookie pattern). */
export function issueCsrfToken(res) {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return token;
}

export function clearCsrfToken(res) {
  res.clearCookie(CSRF_COOKIE, { ...baseCookieOptions, httpOnly: false });
}

export function readAuthCookie(req) {
  return req.cookies?.[AUTH_COOKIE];
}

export default {
  AUTH_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  setAuthCookie,
  clearAuthCookie,
  issueCsrfToken,
  clearCsrfToken,
  readAuthCookie,
};

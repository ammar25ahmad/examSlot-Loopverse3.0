import ApiError from '../utils/ApiError.js';
import { safeCompare } from '../utils/tokens.js';
import { CSRF_COOKIE, CSRF_HEADER, readAuthCookie } from '../utils/cookies.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie CSRF protection. Applied to every state-changing
 * request. Pre-authentication endpoints are exempt because they are rate
 * limited and do not act on cookie-derived identity.
 */
export function csrfProtection(exemptPaths = []) {
  const exempt = new Set(exemptPaths);

  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (exempt.has(req.path) || exempt.has(req.originalUrl)) return next();

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.get(CSRF_HEADER);

    if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
      return next(ApiError.forbidden('Invalid or missing CSRF token', 'CSRF_FAILED'));
    }
    return next();
  };
}

export default csrfProtection;

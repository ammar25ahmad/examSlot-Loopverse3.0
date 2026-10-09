import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { readAuthCookie } from '../utils/cookies.js';
import { ROLES, ACCOUNT_STATUS } from '../config/constants.js';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';

export function signToken({ sub, role }) {
  return jwt.sign({ sub: String(sub), role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'examslot',
  });
}

/**
 * Resolves the authenticated principal from the httpOnly cookie. Never trusts
 * a client-supplied id or role.
 */
export const authenticate = async (req, _res, next) => {
  try {
    const token = readAuthCookie(req);
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'examslot' });
    } catch {
      throw ApiError.unauthorized('Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
    }

    if (payload.role === ROLES.ADMIN) {
      const admin = await Admin.findById(payload.sub);
      if (!admin) throw ApiError.unauthorized('Account no longer exists', 'SESSION_INVALID');
      if (
        admin.passwordChangedAt &&
        payload.iat * 1000 < new Date(admin.passwordChangedAt).getTime()
      ) {
        throw ApiError.unauthorized('Your credentials changed. Please sign in again.', 'SESSION_EXPIRED');
      }
      req.user = { id: String(admin._id), role: ROLES.ADMIN };
      req.admin = admin;
      return next();
    }

    if (payload.role === ROLES.STUDENT) {
      const student = await Student.findById(payload.sub);
      if (!student || !student.isActive) {
        throw ApiError.unauthorized('Account is inactive', 'ACCOUNT_INACTIVE');
      }
      if (
        student.passwordChangedAt &&
        payload.iat * 1000 < new Date(student.passwordChangedAt).getTime()
      ) {
        throw ApiError.unauthorized('Your credentials changed. Please sign in again.', 'SESSION_EXPIRED');
      }
      req.user = { id: String(student._id), role: ROLES.STUDENT };
      req.student = student;
      return next();
    }

    throw ApiError.unauthorized('Unknown account role', 'SESSION_INVALID');
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return next(ApiError.forbidden('Administrator access required', 'ADMIN_ONLY'));
  }
  return next();
};

export const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.STUDENT) {
    return next(ApiError.forbidden('Student access required', 'STUDENT_ONLY'));
  }
  return next();
};

/** Ensures a student has finished account setup before workflow actions. */
export const requireSetupComplete = (req, res, next) => {
  if (req.student && req.student.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    return next(
      ApiError.forbidden('Please finish setting up your account password.', 'SETUP_INCOMPLETE')
    );
  }
  return next();
};

export default { authenticate, requireAdmin, requireStudent, requireSetupComplete, signToken };

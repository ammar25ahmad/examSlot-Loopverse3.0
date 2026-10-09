import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import { ACCOUNT_STATUS, EMAIL_STATUS, ROLES } from '../config/constants.js';
import { generateToken, hashToken, buildFrontendLink } from '../utils/tokens.js';
import { signToken } from '../middleware/auth.js';
import {
  sendPasswordResetEmail,
  sendStudentSetupEmail,
  isEmailConfigured,
} from './emailService.js';
import logger from '../utils/logger.js';

const SETUP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function login({ email, password, expectedRole }) {
  const normalized = String(email).toLowerCase().trim();

  if (expectedRole === ROLES.ADMIN) {
    const admin = await Admin.findOne({ email: normalized }).select('+passwordHash');
    if (!admin || !(await admin.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }
    admin.lastLoginAt = new Date();
    await admin.save({ validateBeforeSave: false });
    const token = signToken({ sub: admin._id, role: ROLES.ADMIN });
    return { token, user: admin.toJSON(), role: ROLES.ADMIN };
  }

  const student = await Student.findOne({ email: normalized }).select('+passwordHash');
  if (!student || !student.passwordHash || !(await student.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  if (!student.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact the administrator.', 'ACCOUNT_INACTIVE');
  }
  if (student.accountStatus === ACCOUNT_STATUS.PENDING_SETUP) {
    throw ApiError.forbidden(
      'Your account setup is not complete. Please use the password setup link emailed to you.',
      'SETUP_REQUIRED'
    );
  }
  student.lastLoginAt = new Date();
  await student.save({ validateBeforeSave: false });
  const token = signToken({ sub: student._id, role: ROLES.STUDENT });
  return { token, user: student.toJSON(), role: ROLES.STUDENT };
}

/** Sets a password from a one-time setup token, activating the account. */
export async function setPassword({ token, password }) {
  const hash = hashToken(token);
  const student = await Student.findOne({ setupTokenHash: hash }).select(
    '+setupTokenHash +setupTokenExpiresAt +passwordHash'
  );
  if (!student || !student.setupTokenExpiresAt) {
    throw ApiError.badRequest('This setup link is invalid or has already been used.', 'INVALID_SETUP_TOKEN');
  }
  if (student.setupTokenExpiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This setup link has expired. Please request a new one.', 'SETUP_TOKEN_EXPIRED');
  }

  student.passwordHash = await Student.hashPassword(password);
  student.accountStatus = ACCOUNT_STATUS.ACTIVE;
  student.setupTokenHash = null;
  student.setupTokenExpiresAt = null;
  student.passwordChangedAt = new Date();
  await student.save();

  return student.toJSON();
}

/**
 * Starts a password reset. Always returns the same generic result so the
 * endpoint never reveals whether an email exists.
 */
export async function forgotPassword({ email }) {
  const normalized = String(email).toLowerCase().trim();
  const generic = { message: 'If that email is registered, a reset link has been sent.' };

  let user = await Student.findOne({ email: normalized });
  let model = Student;
  if (!user) {
    user = await Admin.findOne({ email: normalized });
    model = Admin;
  }
  if (!user) return generic;

  const token = generateToken();
  const update = {
    resetTokenHash: hashToken(token),
    resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
  await model.updateOne({ _id: user._id }, { $set: update });

  const url = buildFrontendLink('/reset-password', token);
  const result = await sendPasswordResetEmail({ user, url });
  if (user instanceof Student) {
    await Student.updateOne(
      { _id: user._id },
      { $set: { emailStatus: result.status, emailLastError: result.error, emailLastAttemptAt: new Date() } }
    );
  }
  if (result.status === EMAIL_STATUS.DISABLED) {
    logger.warn('Password reset requested but email delivery is disabled.');
  }
  return generic;
}

export async function resetPassword({ token, password }) {
  const hash = hashToken(token);

  let user = await Student.findOne({ resetTokenHash: hash }).select('+resetTokenHash +resetTokenExpiresAt +passwordHash');
  let model = Student;
  if (!user) {
    user = await Admin.findOne({ resetTokenHash: hash }).select('+resetTokenHash +resetTokenExpiresAt +passwordHash');
    model = Admin;
  }
  if (!user || !user.resetTokenExpiresAt) {
    throw ApiError.badRequest('This reset link is invalid or has already been used.', 'INVALID_RESET_TOKEN');
  }
  if (user.resetTokenExpiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This reset link has expired. Please request a new one.', 'RESET_TOKEN_EXPIRED');
  }

  const passwordHash = await (model === Student ? Student.hashPassword(password) : Admin.hashPassword(password));
  await model.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash, passwordChangedAt: new Date() },
      $unset: { resetTokenHash: '', resetTokenExpiresAt: '' },
    }
  );

  if (model === Student) {
    await Student.updateOne(
      { _id: user._id, accountStatus: ACCOUNT_STATUS.PENDING_SETUP },
      { $set: { accountStatus: ACCOUNT_STATUS.ACTIVE } }
    );
  }
  return { message: 'Password updated. You can now sign in.' };
}

/**
 * Issues a fresh setup token for a student and attempts delivery.
 * Used during admin creation and by the resend action.
 */
export async function issueSetupTokenAndSend(student, { resend = false } = {}) {
  const token = generateToken();
  student.setupTokenHash = hashToken(token);
  student.setupTokenExpiresAt = new Date(Date.now() + SETUP_TOKEN_TTL_MS);
  if (!student.passwordHash) student.accountStatus = ACCOUNT_STATUS.PENDING_SETUP;
  await student.save();

  const url = buildFrontendLink('/set-password', token);
  const result = await sendStudentSetupEmail({ student, url });

  await Student.updateOne(
    { _id: student._id },
    {
      $set: {
        emailStatus: result.status,
        emailLastError: result.error || '',
        emailLastAttemptAt: new Date(),
      },
    }
  );

  return {
    emailStatus: result.status,
    emailError: result.error || '',
    emailConfigured: isEmailConfigured(),
    resent: resend,
  };
}

export default {
  login,
  setPassword,
  forgotPassword,
  resetPassword,
  issueSetupTokenAndSend,
};

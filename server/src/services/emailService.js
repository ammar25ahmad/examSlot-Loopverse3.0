import env from '../config/env.js';
import logger from '../utils/logger.js';
import { EMAIL_STATUS } from '../config/constants.js';
import {
  studentSetupEmail,
  passwordResetEmail,
  requestReviewedEmail,
} from './emailTemplates.js';

// Resend is loaded lazily so a cold start does not pay for it when email is off.
let clientPromise = null;
function getClient() {
  if (!env.isEmailConfigured) return null;
  if (!clientPromise) {
    clientPromise = import('resend')
      .then(({ Resend }) => new Resend(env.RESEND_API_KEY))
      .catch((err) => {
        logger.error('Failed to initialise Resend client:', err.message);
        return null;
      });
  }
  return clientPromise;
}

export function isEmailConfigured() {
  return Boolean(env.isEmailConfigured);
}

/**
 * Low-level send. Never throws: returns an explicit delivery result so callers
 * can surface an honest status (SENT / FAILED / DISABLED) instead of assuming
 * success.
 */
export async function sendEmail({ to, subject, html, text }) {
  const client = await getClient();
  if (!client) {
    logger.warn(`Email not sent (Resend unconfigured): "${subject}" -> ${to}`);
    return {
      status: EMAIL_STATUS.DISABLED,
      error: 'Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
    };
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      throw new Error(error.message || 'Resend rejected the message');
    }
    logger.info(`Email sent to ${to}: ${subject} (id=${data?.id})`);
    return { status: EMAIL_STATUS.SENT, error: '', id: data?.id };
  } catch (err) {
    logger.error(`Email delivery failed to ${to}: ${err.message}`);
    return { status: EMAIL_STATUS.FAILED, error: err.message };
  }
}

export async function sendStudentSetupEmail({ student, url }) {
  const { subject, html, text } = studentSetupEmail({ student, url });
  return sendEmail({ to: student.email, subject, html, text });
}

export async function sendPasswordResetEmail({ user, url }) {
  const { subject, html, text } = passwordResetEmail({ user, url });
  return sendEmail({ to: user.email, subject, html, text });
}

export async function sendRequestReviewedEmail(args) {
  const { subject, html, text } = requestReviewedEmail(args);
  return sendEmail({ to: args.student.email, subject, html, text });
}

export default {
  sendEmail,
  isEmailConfigured,
  sendStudentSetupEmail,
  sendPasswordResetEmail,
  sendRequestReviewedEmail,
};

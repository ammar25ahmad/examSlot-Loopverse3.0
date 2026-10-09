import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limiting is disabled under automated tests.
  skip: () => env.isTest,
  handler: (_req, _res, next) => next(ApiError.tooMany()),
};

export const generalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 600,
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
});

export const passwordLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 15,
});

export const requestLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 30,
});

export default { generalLimiter, authLimiter, passwordLimiter, requestLimiter };

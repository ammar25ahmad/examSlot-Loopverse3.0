import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Known, operational errors.
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 422, 'Please correct the highlighted fields.', 'VALIDATION_ERROR', details);
  }

  if (err?.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 422, 'Validation failed.', 'VALIDATION_ERROR', details);
  }

  if (err?.name === 'CastError') {
    return sendError(res, 400, `Invalid value for \`${err.path}\`.`, 'INVALID_ID');
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    return sendError(res, 409, `A record with this ${field} already exists.`, 'DUPLICATE_KEY', {
      field,
    });
  }

  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return sendError(res, 400, 'Malformed request body.', 'MALFORMED_JSON');
  }

  // Unexpected errors: log safely, never leak internals to the client.
  logger.error('Unhandled error:', err?.stack || err?.message || err);
  return sendError(
    res,
    500,
    env.isProduction ? 'Something went wrong on our side.' : err?.message || 'Internal server error',
    'INTERNAL_ERROR'
  );
}

export default { notFoundHandler, errorHandler };

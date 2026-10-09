import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

/**
 * Validates request input against a Zod schema. `source` may be body, query,
 * or params. Parsed/coerced values replace the source so downstream code
 * never reads raw client input.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.') || source,
          message: issue.message,
        }));
        return next(ApiError.unprocessable('Please correct the highlighted fields.', 'VALIDATION_ERROR', details));
      }
      return next(err);
    }
  };
}

/** Rejects requests whose params.id is not a valid Mongo ObjectId. */
export function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!/^[0-9a-fA-F]{24}$/.test(String(value))) {
      return next(ApiError.badRequest(`Invalid ${paramName}`, 'INVALID_ID'));
    }
    return next();
  };
}

export default { validate, validateObjectId };

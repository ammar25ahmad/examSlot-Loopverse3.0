import ApiError from './ApiError.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

function toInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalises and validates pagination query parameters.
 * Returns { page, limit, skip }.
 */
export function parsePagination(query = {}) {
  const page = toInt(query.page, DEFAULT_PAGE);
  const limit = toInt(query.limit, DEFAULT_LIMIT);

  if (page < 1) throw ApiError.badRequest('`page` must be a positive integer', 'INVALID_PAGINATION');
  if (limit < 1 || limit > MAX_LIMIT) {
    throw ApiError.badRequest(
      `\`limit\` must be between 1 and ${MAX_LIMIT}`,
      'INVALID_PAGINATION'
    );
  }

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Builds the standard pagination envelope returned by list endpoints.
 */
export function buildPaginationMeta({ page, limit, totalItems }) {
  const safeTotal = Math.max(0, Number(totalItems) || 0);
  return {
    page,
    limit,
    totalItems: safeTotal,
    totalPages: Math.max(1, Math.ceil(safeTotal / limit)),
  };
}

export function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default { parsePagination, buildPaginationMeta, escapeRegExp };

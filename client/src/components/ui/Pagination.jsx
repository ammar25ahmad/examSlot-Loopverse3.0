import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, totalItems, limit, onPageChange, onLimitChange, limitOptions = [10, 20, 50] }) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const from = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm muted">
        {totalItems === 0 ? 'No results' : `Showing ${from}–${to} of ${totalItems}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange && (
          <label className="flex items-center gap-2 text-sm muted">
            Rows
            <select
              className="input w-auto py-1.5"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {page} / {safeTotalPages}
          </span>
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= safeTotalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;

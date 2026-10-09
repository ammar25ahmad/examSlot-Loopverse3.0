import { useCallback, useEffect, useRef, useState } from 'react';

const EMPTY_PAGINATION = { page: 1, limit: 10, totalItems: 0, totalPages: 1 };

export function useList(fetcher, initialFilters = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [filters, setFilters] = useState({ page: 1, limit: 10, ...initialFilters });
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current(JSON.parse(filtersKey));
      setData(res.data || []);
      setPagination(res.pagination || EMPTY_PAGINATION);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    updateFilter,
    setPage: (page) => setFilters((f) => ({ ...f, page })),
    setLimit: (limit) => setFilters((f) => ({ ...f, limit, page: 1 })),
    reload: load,
  };
}

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ loading: false, error: null, data });
      return data;
    } catch (err) {
      setState({ loading: false, error: err.message || 'Failed to load', data: null });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

export default useList;

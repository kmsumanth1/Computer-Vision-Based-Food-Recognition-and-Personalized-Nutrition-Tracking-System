import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import type { ApiErrorInfo } from '../types/api';
import { parseApiError } from '../utils/apiError';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorInfo | null;
}

/**
 * Loads data through a service function and tracks loading/error state.
 * Re-runs when `deps` change; stale responses are ignored.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(
    async (options?: { silent?: boolean }) => {
      const id = ++requestId.current;
      if (!options?.silent) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetcher();
        if (id === requestId.current) setState({ data, loading: false, error: null });
      } catch (error) {
        if (id === requestId.current) setState((s) => ({ ...s, loading: false, error: parseApiError(error) }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    void run();
    return () => {
      requestId.current++;
    };
  }, [run]);

  const setData = useCallback((updater: (prev: T) => T) => {
    setState((s) => (s.data ? { ...s, data: updater(s.data) } : s));
  }, []);

  return { ...state, reload: run, setData };
}

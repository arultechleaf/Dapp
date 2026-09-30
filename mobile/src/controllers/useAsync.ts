import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from '../models/format';

type Result<T> = { fetcher: () => Promise<T>; nonce: number; data?: T; error?: string };

/**
 * Runs `fetcher` whenever it changes (memoize it with useCallback) or `refresh()` is called.
 * Stale responses are dropped; previous data stays visible while a refresh is in flight.
 */
export function useAsync<T>(fetcher: (() => Promise<T>) | undefined) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T>>();

  useEffect(() => {
    if (!fetcher) return;
    let cancelled = false;
    fetcher().then(
      (data) => !cancelled && setResult({ fetcher, nonce, data }),
      (e) => !cancelled && setResult({ fetcher, nonce, error: errorMessage(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const current = !!fetcher && result?.fetcher === fetcher;

  return {
    data: current ? result.data : undefined,
    error: current ? result.error : undefined,
    loading: !!fetcher && (!current || result.nonce !== nonce),
    refresh,
  };
}

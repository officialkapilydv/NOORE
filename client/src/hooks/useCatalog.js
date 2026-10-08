import { useCallback, useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

const cache = new Map();

// Forget cached catalog data when the tab regains focus (e.g. after editing in /admin) or every 5 minutes.
if (typeof window !== 'undefined') {
  let lastClear = Date.now();
  const maybeClear = () => { if (Date.now() - lastClear > 30_000) { cache.clear(); lastClear = Date.now(); } };
  window.addEventListener('focus', maybeClear);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && maybeClear());
  setInterval(() => { cache.clear(); }, 5 * 60_000);
}

/** Small fetch hook with in-memory caching keyed by the request signature. */
export function useFetch(key, fetcher, { enabled = true, deps = [] } = {}) {
  const [state, setState] = useState(() => ({ data: cache.get(key) ?? null, error: null, loading: !cache.has(key) }));
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const id = ++latest.current;
    if (cache.has(key)) setState({ data: cache.get(key), error: null, loading: false });
    else setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (id !== latest.current) return;
        cache.set(key, data);
        setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (id !== latest.current) return;
        setState((s) => ({ ...s, error, loading: false }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, attempt, ...deps]);

  const refetch = useCallback(() => { cache.delete(key); setAttempt((n) => n + 1); }, [key]);
  return { ...state, refetch };
}

export const useProducts = (params = {}) => useFetch(`products:${JSON.stringify(params)}`, () => api.products(params));
export const useProduct = (slug) => useFetch(`product:${slug}`, () => api.product(slug), { enabled: Boolean(slug) });
export const useCollections = () => useFetch('collections', () => api.collections());
export const useCollection = (slug, params = {}) => useFetch(`collection:${slug}:${JSON.stringify(params)}`, () => api.collection(slug, params), { enabled: Boolean(slug) });
export const invalidate = (prefix) => { for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k); };

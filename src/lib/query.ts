import { useCallback, useEffect, useReducer } from "react";

/**
 * Minimal data cache with stale-while-revalidate — a tiny stand-in for a query
 * library. Results are cached by key in a module-level Map so revisiting a page
 * shows data instantly (no empty flash); a background refetch keeps it fresh.
 * Mutations call `invalidateQuery(prefix)` to refetch affected keys.
 */

type Entry = {
  data: unknown;
  error: unknown;
  inflight: boolean;
  fetcher: () => Promise<unknown>;
};

const cache = new Map<string, Entry>();
const subscribers = new Map<string, Set<() => void>>();

function emit(key: string) {
  subscribers.get(key)?.forEach((fn) => fn());
}

function runFetch(key: string) {
  const entry = cache.get(key);
  if (!entry || entry.inflight) return;
  entry.inflight = true;
  entry
    .fetcher()
    .then(
      (data) => {
        entry.data = data;
        entry.error = undefined;
      },
      (error) => {
        entry.error = error;
      },
    )
    .finally(() => {
      entry.inflight = false;
      emit(key);
    });
}

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  // Keep the latest fetcher on the cache entry so invalidation can refetch it.
  if (key) {
    const existing = cache.get(key);
    if (existing) existing.fetcher = fetcher as () => Promise<unknown>;
    else
      cache.set(key, {
        data: undefined,
        error: undefined,
        inflight: false,
        fetcher: fetcher as () => Promise<unknown>,
      });
  }

  useEffect(() => {
    if (!key) return;
    let set = subscribers.get(key);
    if (!set) {
      set = new Set();
      subscribers.set(key, set);
    }
    set.add(rerender);
    const entry = cache.get(key)!;
    if (entry.data === undefined && entry.error === undefined) runFetch(key);
    return () => {
      set!.delete(rerender);
    };
  }, [key]);

  const entry = key ? cache.get(key) : undefined;
  const data = entry?.data as T | undefined;
  const refetch = useCallback(() => {
    if (key) runFetch(key);
  }, [key]);

  return {
    data,
    error: entry?.error,
    loading: !!key && data === undefined && entry?.error === undefined,
    refetch,
  };
}

/** Refetch every cached key that starts with `prefix` (e.g. "books"). */
export function invalidateQuery(prefix: string) {
  for (const key of [...cache.keys()]) {
    if (key !== prefix && !key.startsWith(prefix)) continue;
    // Sin suscriptores no hay quien pinte el resultado: soltar la entrada en
    // vez de refetchear a nadie (se recargará al volver a montarse).
    if (subscribers.get(key)?.size) runFetch(key);
    else cache.delete(key);
  }
}

/** Vaciar todo al cerrar sesión: que no queden datos del usuario anterior. */
export function clearQueryCache() {
  cache.clear();
}

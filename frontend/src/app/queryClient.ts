interface CacheEntry<T = unknown> {
  value?: T;
  updatedAt?: number;
  promise?: Promise<T>;
}

export interface QueryClientLike {
  fetch: <T>(key: string, loader: () => Promise<T>, options?: { staleTimeMs?: number }) => Promise<T>;
  invalidate: (key: string) => boolean;
  clear: () => void;
}

export function createQueryClient({ clock = () => Date.now() }: { clock?: () => number } = {}): QueryClientLike {
  const cache = new Map<string, CacheEntry>();
  return Object.freeze({
    async fetch<T>(
      key: string,
      loader: () => Promise<T>,
      { staleTimeMs = 30_000 }: { staleTimeMs?: number } = {}
    ): Promise<T> {
      const entry = cache.get(key) as CacheEntry<T> | undefined;
      if (entry?.value !== undefined && entry.updatedAt !== undefined && clock() - entry.updatedAt < staleTimeMs) {
        return entry.value;
      }
      if (entry?.promise) return entry.promise;
      const promise = Promise.resolve()
        .then(loader)
        .then((value) => {
          cache.set(key, { value, updatedAt: clock() });
          return value;
        })
        .finally(() => {
          const current = cache.get(key);
          if (current?.promise) cache.set(key, { value: current.value, updatedAt: current.updatedAt });
        });
      cache.set(key, { ...entry, promise });
      return promise;
    },
    invalidate: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
  });
}

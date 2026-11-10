export function createQueryClient({ clock = () => Date.now() } = {}) {
  const cache = new Map();
  return Object.freeze({
    async fetch(key, loader, { staleTimeMs = 30_000 } = {}) {
      const entry = cache.get(key);
      if (entry?.value !== undefined && clock() - entry.updatedAt < staleTimeMs) return entry.value;
      if (entry?.promise) return entry.promise;
      const promise = Promise.resolve().then(loader).then((value) => { cache.set(key, { value, updatedAt: clock() }); return value; }).finally(() => { const current = cache.get(key); if (current?.promise) cache.set(key, { value: current.value, updatedAt: current.updatedAt }); });
      cache.set(key, { ...entry, promise });
      return promise;
    },
    invalidate: (key) => cache.delete(key),
    clear: () => cache.clear()
  });
}

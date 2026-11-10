export function createReplayProtector({ clock = () => Date.now(), maximumEntries = 10_000 } = {}) {
  const seen = new Map();
  return Object.freeze({
    claim(key, ttlMs) { if (typeof key !== 'string' || !key || !Number.isInteger(ttlMs) || ttlMs < 1) throw new TypeError('A replay key and positive TTL are required.'); const now = clock(); for (const [item, expiresAt] of seen) if (expiresAt <= now) seen.delete(item); if (seen.has(key)) return false; if (seen.size >= maximumEntries) seen.delete(seen.keys().next().value); seen.set(key, now + ttlMs); return true; },
    has: (key) => (seen.get(key) ?? 0) > clock()
  });
}

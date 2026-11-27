import { prisma } from '@charitychain/database';

/**
 * Postgres-backed counters for authentication throttling. All state lives in
 * `auth_throttles` so limits survive restarts and are shared across instances.
 * The interface (`get`, `consumeWindow`, `recordFailure`, `setLock`, `clear`,
 * `purgeOlderThan`) is deliberately small so a Redis store can replace it.
 */
export function createThrottleRepository(database = prisma) {
  return {
    async get(key) {
      return database.authThrottle.findUnique({ where: { key } });
    },

    /** Atomic fixed-window counter. Returns the updated row. */
    async consumeWindow(key, kind, windowMs) {
      const rows = await database.$queryRaw`
        INSERT INTO "auth_throttles" ("key", "kind", "failures", "windowStartedAt", "updatedAt")
        VALUES (${key}, ${kind}, 1, now(), now())
        ON CONFLICT ("key") DO UPDATE SET
          "failures" = CASE
            WHEN "auth_throttles"."windowStartedAt" + (${windowMs}::int * interval '1 millisecond') <= now()
            THEN 1 ELSE "auth_throttles"."failures" + 1 END,
          "windowStartedAt" = CASE
            WHEN "auth_throttles"."windowStartedAt" + (${windowMs}::int * interval '1 millisecond') <= now()
            THEN now() ELSE "auth_throttles"."windowStartedAt" END,
          "updatedAt" = now()
        RETURNING "failures", "windowStartedAt"`;
      return rows[0];
    },

    /**
     * Atomically increments a failure counter. Counters decay: a failure more
     * than `decayMs` after the previous one starts again from 1.
     */
    async recordFailure(key, kind, decayMs) {
      const rows = await database.$queryRaw`
        INSERT INTO "auth_throttles" ("key", "kind", "failures", "windowStartedAt", "updatedAt")
        VALUES (${key}, ${kind}, 1, now(), now())
        ON CONFLICT ("key") DO UPDATE SET
          "failures" = CASE
            WHEN "auth_throttles"."updatedAt" + (${decayMs}::int * interval '1 millisecond') <= now()
            THEN 1 ELSE "auth_throttles"."failures" + 1 END,
          "updatedAt" = now()
        RETURNING "failures"`;
      return rows[0];
    },

    setLock(key, lockedUntil) {
      return database.authThrottle.update({ where: { key }, data: { lockedUntil } });
    },

    async clear(key) {
      await database.authThrottle.deleteMany({ where: { key } });
    },

    async purgeOlderThan(date) {
      const result = await database.authThrottle.deleteMany({
        where: { updatedAt: { lt: date }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: date } }] }
      });
      return result.count;
    }
  };
}

export const throttleRepository = createThrottleRepository();

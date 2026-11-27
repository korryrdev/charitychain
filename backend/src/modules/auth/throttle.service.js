import { createHash } from 'node:crypto';
import { authenticationConfig } from '../../config/authentication.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { throttleRepository } from './throttle.repository.js';

const FAILURE_DECAY_MS = 30 * 60_000;
const PURGE_AGE_MS = 24 * 3_600_000;
const PURGE_PROBABILITY = 0.01;

const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 40);

/** 429 carrying the number of seconds the caller must wait. */
export class ThrottledError extends AppError {
  constructor(retryAfterSeconds, message) {
    const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
    super({
      message: message ?? `Too many attempts. Please try again in ${seconds} seconds.`,
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
      expose: true,
      details: { retryAfterSeconds: seconds }
    });
    this.retryAfterSeconds = seconds;
  }
}

/**
 * Lock duration (seconds) after the n-th failure, or 0 when under the limit.
 * With the default schedule and a limit of 5: failures 1-4 → 0, 5th → 30s,
 * 6th → 60s, 7th → 300s, 8th and later → 900s (cap).
 */
export function lockSecondsForFailures(failures, maxFailures, schedule) {
  if (failures < maxFailures) return 0;
  const index = Math.min(failures - maxFailures, schedule.length - 1);
  return schedule[index];
}

export function createThrottleService({
  repository = throttleRepository,
  config = authenticationConfig,
  now = () => Date.now(),
  random = Math.random
} = {}) {
  const { throttle } = config;

  async function maybePurge() {
    if (random() < PURGE_PROBABILITY) {
      await repository.purgeOlderThan(new Date(now() - PURGE_AGE_MS)).catch(() => {});
    }
  }

  async function consume(key, kind, limit, windowMs, message) {
    const row = await repository.consumeWindow(key, kind, windowMs);
    await maybePurge();
    if (row.failures > limit) {
      const resetAt = new Date(row.windowStartedAt).getTime() + windowMs;
      throw new ThrottledError((resetAt - now()) / 1000, message);
    }
  }

  const loginKey = (email, ip) => `login:${digest(`${email}|${ip ?? 'unknown'}`)}`;

  return {
    loginKey,

    /** Throws ThrottledError while the email+IP pair is locked out. */
    async assertLoginAllowed(email, ip) {
      if (ip) {
        await consume(
          `login-ip:${digest(ip)}`,
          'login-ip',
          throttle.ipLoginPerMinute,
          60_000
        );
      }
      const row = await repository.get(loginKey(email, ip));
      if (row?.lockedUntil && new Date(row.lockedUntil).getTime() > now()) {
        throw new ThrottledError(
          (new Date(row.lockedUntil).getTime() - now()) / 1000,
          undefined
        );
      }
    },

    /** Records a failed login; throws ThrottledError if this failure triggers a lock. */
    async recordLoginFailure(email, ip) {
      const key = loginKey(email, ip);
      const { failures } = await repository.recordFailure(key, 'login', FAILURE_DECAY_MS);
      const seconds = lockSecondsForFailures(
        failures,
        config.maxLoginAttempts,
        throttle.lockScheduleSeconds
      );
      if (seconds > 0) {
        await repository.setLock(key, new Date(now() + seconds * 1000));
        return { failures, lockedForSeconds: seconds };
      }
      return { failures, lockedForSeconds: 0 };
    },

    resetLogin(email, ip) {
      return repository.clear(loginKey(email, ip));
    },

    registerAllowed(ip) {
      return consume(
        `register:${digest(ip ?? 'unknown')}`,
        'register',
        throttle.registerPerHour,
        3_600_000
      );
    },

    /** Cooldown + hourly cap per email. Applies to unknown emails identically. */
    async resendAllowed(email) {
      const hash = digest(email);
      await consume(
        `resend-min:${hash}`,
        'resend-min',
        1,
        throttle.resendCooldownSeconds * 1000,
        undefined
      );
      await consume(`resend-hour:${hash}`, 'resend-hour', throttle.resendPerHour, 3_600_000);
    },

    resetRequestAllowed(email) {
      return consume(
        `reset:${digest(email)}`,
        'reset',
        throttle.resetPerHour,
        3_600_000
      );
    },

    /** Failed current-password checks while changing a password. */
    async assertPasswordChangeAllowed(userId) {
      const row = await repository.get(`pwchange:${userId}`);
      if (row?.lockedUntil && new Date(row.lockedUntil).getTime() > now()) {
        throw new ThrottledError((new Date(row.lockedUntil).getTime() - now()) / 1000);
      }
    },
    async recordPasswordChangeFailure(userId) {
      const key = `pwchange:${userId}`;
      const { failures } = await repository.recordFailure(key, 'pwchange', FAILURE_DECAY_MS);
      const seconds = lockSecondsForFailures(
        failures,
        config.maxLoginAttempts,
        throttle.lockScheduleSeconds
      );
      if (seconds > 0) await repository.setLock(key, new Date(now() + seconds * 1000));
      return { failures, lockedForSeconds: seconds };
    },
    resetPasswordChange(userId) {
      return repository.clear(`pwchange:${userId}`);
    }
  };
}

export const throttleService = createThrottleService();

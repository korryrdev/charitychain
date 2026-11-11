import { securityConfig } from '../config/security.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export class MemoryRateLimitStore {
  constructor({ maximumEntries = 10_000 } = {}) {
    this.entries = new Map();
    this.maximumEntries = maximumEntries;
  }

  increment(key, windowMs, now = Date.now()) {
    const existing = this.entries.get(key);
    if (!existing || existing.resetAt <= now) {
      if (!existing && this.entries.size >= this.maximumEntries) {
        for (const [entryKey, entry] of this.entries) {
          if (entry.resetAt <= now) this.entries.delete(entryKey);
        }
        while (this.entries.size >= this.maximumEntries) {
          this.entries.delete(this.entries.keys().next().value);
        }
      }
      const entry = { count: 1, resetAt: now + windowMs };
      this.entries.set(key, entry);
      return entry;
    }
    existing.count += 1;
    return existing;
  }
}

export function createRateLimit({
  windowMs = securityConfig.rateLimit.windowMs,
  maximumRequests = securityConfig.rateLimit.maximumRequests,
  store = new MemoryRateLimitStore(),
  keyGenerator = (request) => request.auth?.user?.id ?? request.ip
} = {}) {
  return function rateLimit(request, response, next) {
    const entry = store.increment(keyGenerator(request), windowMs);
    const remaining = Math.max(0, maximumRequests - entry.count);
    response.set('RateLimit-Limit', String(maximumRequests));
    response.set('RateLimit-Remaining', String(remaining));
    response.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maximumRequests) {
      response.set(
        'Retry-After',
        String(Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)))
      );
      return next(
        new AppError({
          message: 'Too many requests. Please try again later.',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          statusCode: 429,
          expose: true
        })
      );
    }
    return next();
  };
}

export const rateLimit = createRateLimit();

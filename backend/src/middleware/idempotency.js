import { createHash } from 'node:crypto';
import { AppError } from '../errors/AppError.js';
import { ConflictError } from '../errors/ConflictError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { ValidationError } from '../errors/ValidationError.js';

const keyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])])
    );
  }
  return value;
}

function requestFingerprint(request) {
  const value = {
    actorId: request.auth?.user?.id ?? null,
    method: request.method,
    path: request.originalUrl,
    body: stableValue(request.body ?? null)
  };
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export class MemoryIdempotencyStore {
  constructor({ maximumEntries = 10_000 } = {}) {
    this.entries = new Map();
    this.maximumEntries = maximumEntries;
  }

  async begin(key, fingerprint, ttlMs) {
    const now = Date.now();
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > now) {
      if (existing.fingerprint !== fingerprint) return { state: 'conflict' };
      if (existing.response) return { state: 'complete', response: existing.response };
      return { state: 'in-progress' };
    }
    if (!existing && this.entries.size >= this.maximumEntries) {
      for (const [entryKey, entry] of this.entries) {
        if (entry.expiresAt <= now) this.entries.delete(entryKey);
      }
      while (this.entries.size >= this.maximumEntries) {
        this.entries.delete(this.entries.keys().next().value);
      }
    }
    this.entries.set(key, { fingerprint, expiresAt: now + ttlMs, response: null });
    return { state: 'started' };
  }

  async complete(key, response) {
    const entry = this.entries.get(key);
    if (entry) entry.response = response;
  }

  async remove(key) {
    this.entries.delete(key);
  }
}

export function createIdempotency({
  store = new MemoryIdempotencyStore(),
  ttlMs = 24 * 60 * 60 * 1000,
  requiredMethods = ['POST', 'PUT', 'PATCH']
} = {}) {
  const protectedMethods = new Set(requiredMethods);

  return async function idempotency(request, response, next) {
    if (!protectedMethods.has(request.method)) return next();

    const key = request.get('idempotency-key');
    if (!keyPattern.test(key ?? '')) {
      return next(
        new ValidationError('A valid Idempotency-Key header is required.', [
          { path: 'headers.idempotency-key', message: 'Use 8 to 128 safe characters.' }
        ])
      );
    }

    try {
      const fingerprint = requestFingerprint(request);
      const result = await store.begin(key, fingerprint, ttlMs);
      if (result.state === 'conflict') {
        return next(
          new ConflictError('The idempotency key was already used for a different request.', {
            code: ERROR_CODES.IDEMPOTENCY_CONFLICT
          })
        );
      }
      if (result.state === 'in-progress') {
        return next(
          new AppError({
            message: 'A request with this idempotency key is still being processed.',
            code: ERROR_CODES.IDEMPOTENCY_IN_PROGRESS,
            statusCode: 409,
            expose: true,
            retryable: true
          })
        );
      }
      if (result.state === 'complete') {
        response.set('Idempotency-Replayed', 'true');
        for (const [name, value] of Object.entries(result.response.headers))
          response.set(name, value);
        return response.status(result.response.statusCode).send(result.response.body);
      }

      const originalSend = response.send.bind(response);
      let responseBody;
      response.send = (body) => {
        responseBody = body;
        return originalSend(body);
      };
      response.once('finish', () => {
        if (response.statusCode >= 500) {
          void store.remove(key);
          return;
        }
        void store.complete(key, {
          statusCode: response.statusCode,
          headers: {
            'content-type': response.get('content-type') ?? 'application/json; charset=utf-8'
          },
          body: responseBody
        });
      });
      response.once('close', () => {
        if (!response.writableFinished) void store.remove(key);
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export const idempotency = createIdempotency();

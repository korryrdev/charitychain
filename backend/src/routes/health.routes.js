import { Router } from 'express';
import { databaseHealth } from '@charitychain/database';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

async function runCheck(check, timeoutMs) {
  let timeoutIdentifier;
  const timeout = new Promise((_, reject) => {
    timeoutIdentifier = setTimeout(
      () => reject(new Error('Dependency check timed out.')),
      timeoutMs
    );
    timeoutIdentifier.unref?.();
  });
  try {
    await Promise.race([check(), timeout]);
  } finally {
    clearTimeout(timeoutIdentifier);
  }
}

export function createHealthRouter({
  checks = { database: databaseHealth },
  timeoutMs = 5_000
} = {}) {
  const router = Router();

  router.get('/live', (_request, response) => {
    response.status(200).json({ status: 'ok', service: 'charitychain-api' });
  });

  router.get('/ready', async (_request, response, next) => {
    const entries = Object.entries(checks);
    const results = await Promise.allSettled(
      entries.map(([, check]) => runCheck(check, timeoutMs))
    );
    const dependencies = Object.fromEntries(
      entries.map(([name], index) => [
        name,
        results[index].status === 'fulfilled' ? 'ok' : 'unavailable'
      ])
    );
    if (results.some((result) => result.status === 'rejected')) {
      return next(
        new AppError({
          message: 'The service is not ready to receive traffic.',
          code: ERROR_CODES.INTEGRATION_UNAVAILABLE,
          statusCode: 503,
          details: { dependencies },
          expose: true,
          retryable: true
        })
      );
    }
    return response.status(200).json({ status: 'ready', dependencies });
  });

  return router;
}

export const healthRouter = createHealthRouter();

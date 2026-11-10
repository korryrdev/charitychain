import { logger as defaultLogger } from '../observability/logger.js';

export function createRequestLogger({ logger = defaultLogger } = {}) {
  return function requestLogger(request, response, next) {
    const startedAt = process.hrtime.bigint();
    response.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info(
        {
          requestId: request.id,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs,
          actorId: request.auth?.user?.id
        },
        'HTTP request completed'
      );
    });
    next();
  };
}

export const requestLogger = createRequestLogger();

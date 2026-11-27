import { logger } from '../observability/logger.js';

export function errorHandler(error, request, response, _next) {
  if (response.headersSent) return _next(error);
  const statusCode =
    Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode <= 599
      ? error.statusCode
      : 500;
  const logContext = { error, requestId: request.id };
  if (statusCode >= 500) {
    logger.error({ ...logContext, err: error, stack: error.stack }, error.message || 'Request failed');
  }
  else logger.warn(logContext, 'Request rejected');

  const safeError =
    typeof error.toResponse === 'function'
      ? error.toResponse(request.id)
      : {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'The request could not be completed.',
          ...(request.id ? { requestId: request.id } : {})
        };

  response.status(statusCode).json({ error: safeError });
}

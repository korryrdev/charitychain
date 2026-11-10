import { AppError } from './AppError.js';
import { ERROR_CODES } from './errorCodes.js';

export class IntegrationError extends AppError {
  constructor(integration, message = 'An external service request failed.', options = {}) {
    super({
      message,
      code: options.code ?? ERROR_CODES.INTEGRATION_UNAVAILABLE,
      statusCode: options.statusCode ?? 502,
      details: options.details,
      cause: options.cause,
      expose: options.expose ?? false,
      retryable: options.retryable ?? true
    });
    this.integration = integration;
  }
}

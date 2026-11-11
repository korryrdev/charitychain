import { AppError } from './AppError.js';
import { ERROR_CODES } from './errorCodes.js';

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication is required.', options = {}) {
    super({
      message,
      code: options.code ?? ERROR_CODES.AUTHENTICATION_REQUIRED,
      statusCode: 401,
      details: options.details,
      cause: options.cause,
      expose: true
    });
  }
}

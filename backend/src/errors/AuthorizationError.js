import { AppError } from './AppError.js';
import { ERROR_CODES } from './errorCodes.js';

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action.', options = {}) {
    super({
      message,
      code: options.code ?? ERROR_CODES.FORBIDDEN,
      statusCode: 403,
      details: options.details,
      cause: options.cause,
      expose: true
    });
  }
}

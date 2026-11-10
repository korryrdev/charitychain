import { AppError } from './AppError.js';
import { ERROR_CODES } from './errorCodes.js';

export class ValidationError extends AppError {
  constructor(message = 'The request contains invalid data.', details, options = {}) {
    super({
      message,
      code: options.code ?? ERROR_CODES.VALIDATION_FAILED,
      statusCode: 400,
      details,
      cause: options.cause,
      expose: true
    });
  }
}

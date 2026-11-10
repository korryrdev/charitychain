import { AppError } from './AppError.js';
import { ERROR_CODES } from './errorCodes.js';

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with the current resource state.', options = {}) {
    super({
      message,
      code: options.code ?? ERROR_CODES.CONFLICT,
      statusCode: 409,
      details: options.details,
      cause: options.cause,
      expose: true
    });
  }
}

import { ERROR_CODES } from './errorCodes.js';

export class AppError extends Error {
  constructor({
    message = 'The request could not be completed.',
    code = ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode = 500,
    details,
    cause,
    expose = statusCode < 500,
    retryable = false
  } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.expose = expose;
    this.retryable = retryable;
    this.isOperational = true;
    Error.captureStackTrace?.(this, new.target);
  }

  toResponse(requestId) {
    const response = {
      code: this.code,
      message: this.expose ? this.message : 'The request could not be completed.'
    };
    if (this.expose && this.details !== undefined) response.details = this.details;
    if (requestId) response.requestId = requestId;
    return response;
  }
}

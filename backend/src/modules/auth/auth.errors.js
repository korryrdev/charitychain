import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super('An account already exists for this email address.', { code: ERROR_CODES.CONFLICT });
  }
}

export class InvalidAuthTokenError extends AuthenticationError {
  constructor() {
    super('The token is invalid or has expired.', { code: ERROR_CODES.SESSION_EXPIRED });
  }
}

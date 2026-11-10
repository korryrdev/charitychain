import { AppError } from '../../errors/AppError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

export class DonationNotFoundError extends AppError {
  constructor() {
    super({ message: 'Donation not found.', code: ERROR_CODES.DONATION_NOT_FOUND, statusCode: 404 });
  }
}

export class DonationStateError extends ConflictError {
  constructor(message = 'The donation cannot transition from its current state.') {
    super(message, { code: ERROR_CODES.DONATION_STATE_CONFLICT });
  }
}

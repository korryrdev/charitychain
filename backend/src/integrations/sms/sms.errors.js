import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
export class SmsDeliveryError extends AppError { constructor(message, options = {}) { super({ message, code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503, expose: true, retryable: true, cause: options.cause }); } }

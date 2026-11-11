import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
export class MpesaIntegrationError extends AppError { constructor(message, options = {}) { super({ message, code: options.code ?? ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: options.statusCode ?? 502, expose: true, retryable: options.retryable ?? true, cause: options.cause }); } }

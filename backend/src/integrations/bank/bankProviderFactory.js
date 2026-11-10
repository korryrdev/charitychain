import { integrationsConfig } from '../../config/integrations.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { assertBankProvider } from './bankProvider.interface.js';
import { sandboxBankAdapter } from './sandboxBank.adapter.js';
export function createBankProvider(config = integrationsConfig.bank) { if (config.provider === 'sandbox') return assertBankProvider(sandboxBankAdapter); throw new AppError({ message: `${config.provider} bank adapter is not configured.`, code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503, expose: true }); }

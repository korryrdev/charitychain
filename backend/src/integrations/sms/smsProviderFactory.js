import { integrationsConfig } from '../../config/integrations.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { sandboxSmsAdapter } from './sandboxSms.adapter.js';
import { createAfricasTalkingClient } from './sms.client.js';
import { assertSmsProvider } from './smsProvider.interface.js';
export function createSmsProvider(config = integrationsConfig.sms) { if (!config.enabled) throw new AppError({ message: 'SMS delivery is not enabled.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503, expose: true }); return assertSmsProvider(config.provider === 'sandbox' ? sandboxSmsAdapter : createAfricasTalkingClient({ config })); }

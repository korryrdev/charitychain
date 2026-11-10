import { integrationsConfig } from '../../config/integrations.js';
import { stkPushAdapter } from '../../integrations/mpesa/stkPush.adapter.js';
import { createBankProvider } from '../../integrations/bank/bankProviderFactory.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

function unavailable(name) { return new AppError({ message: `${name} payment integration is not enabled.`, code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503, expose: true, retryable: true }); }

export function createPaymentProviderFactory({ config = integrationsConfig, adapters } = {}) {
  const resolved = adapters ?? { MPESA: config.mpesa.enabled ? stkPushAdapter : null, BANK: config.bank.enabled ? createBankProvider(config.bank) : null };
  return { forDonation(donation) { const provider = donation.channel === 'BANK' ? 'BANK' : 'MPESA'; const adapter = resolved[provider]; if (!adapter) throw unavailable(provider); return { provider, flow: donation.channel === 'MPESA_STK' ? 'STK_PUSH' : donation.channel === 'MPESA_PAYBILL' ? 'C2B' : 'BANK_CHECKOUT', adapter }; } };
}

export const paymentProviderFactory = createPaymentProviderFactory();

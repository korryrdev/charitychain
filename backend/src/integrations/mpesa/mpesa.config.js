import { integrationsConfig } from '../../config/integrations.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
const hosts = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};
export function createMpesaConfig(config = integrationsConfig.mpesa) {
  const callbackBaseUrl = config.callbackBaseUrl.replace(/\/+$/, '');
  return Object.freeze({
    ...config,
    baseUrl: hosts[config.environment],
    oauthPath: '/oauth/v1/generate?grant_type=client_credentials',
    stkPushPath: '/mpesa/stkpush/v1/processrequest',
    stkPushQueryPath: '/mpesa/stkpushquery/v1/query',
    b2cPath: '/mpesa/b2c/v3/paymentrequest',
    b2bPath: '/mpesa/b2b/v1/paymentrequest',
    transactionStatusPath: '/mpesa/transactionstatus/v1/query',
    callbackUrl: `${callbackBaseUrl}/api/v1/webhooks/payments/mpesa/stk`,
    disbursementResultUrl: `${callbackBaseUrl}/api/v1/webhooks/disbursements/mpesa`,
    disbursementTimeoutUrl: `${callbackBaseUrl}/api/v1/webhooks/disbursements/mpesa/timeout`
  });
}
export const mpesaConfig = createMpesaConfig();

export function assertDisbursementCredentials(config, { university = false } = {}) {
  const required = ['shortcode', 'initiatorName', 'securityCredential'];
  if (university) required.push('universityShortcode', 'universityAccount');
  if (required.some((key) => !config[key])) {
    throw new AppError({
      message: 'M-Pesa disbursement credentials are not configured.',
      code: ERROR_CODES.INTEGRATION_UNAVAILABLE,
      statusCode: 503,
      expose: true
    });
  }
}

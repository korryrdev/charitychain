import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { mpesaClient } from './mpesa.client.js';
import { mpesaConfig } from './mpesa.config.js';
import { mpesaTimestamp } from './mpesa.mapper.js';

export function createStkPushQueryAdapter({
  client = mpesaClient,
  config = mpesaConfig,
  now = () => new Date()
} = {}) {
  return {
    async query({ checkoutRequestId }) {
      const timestamp = mpesaTimestamp(now());
      const response = await client.post(config.stkPushQueryPath, {
        BusinessShortCode: config.shortcode,
        Password: Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString(
          'base64'
        ),
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      });

      if (String(response.ResponseCode) !== '0') {
        throw new AppError({
          message: 'M-Pesa could not confirm the STK Push result.',
          code: ERROR_CODES.INTEGRATION_RESPONSE_INVALID,
          statusCode: 503,
          expose: true,
          retryable: true
        });
      }

      return {
        resultCode:
          response.ResultCode === undefined || response.ResultCode === null
            ? null
            : String(response.ResultCode),
        resultMessage: response.ResultDesc ?? response.ResponseDescription ?? null
      };
    }
  };
}

export const stkPushQueryAdapter = createStkPushQueryAdapter();

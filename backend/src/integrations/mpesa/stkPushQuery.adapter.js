import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { mpesaClient } from './mpesa.client.js';
import { mpesaConfig } from './mpesa.config.js';
import { mpesaTimestamp } from './mpesa.mapper.js';
import { classifyMpesaResult, isPendingMpesaError } from './mpesaResultCodes.js';

export function createStkPushQueryAdapter({
  client = mpesaClient,
  config = mpesaConfig,
  now = () => new Date()
} = {}) {
  return {
    async query({ checkoutRequestId }) {
      const timestamp = mpesaTimestamp(now());
      let response;
      try {
        response = await client.post(config.stkPushQueryPath, {
          BusinessShortCode: config.shortcode,
          Password: Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString(
            'base64'
          ),
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        });
      } catch (error) {
        if (isPendingMpesaError(error)) {
          return {
            resultCode: null,
            resultMessage: 'The transaction is still under processing.'
          };
        }
        throw error;
      }

      if (String(response.ResponseCode) !== '0') {
        throw new AppError({
          message: 'M-Pesa could not confirm the STK Push result.',
          code: ERROR_CODES.INTEGRATION_RESPONSE_INVALID,
          statusCode: 503,
          expose: true,
          retryable: true
        });
      }

      const rawMessage = response.ResultDesc ?? response.ResponseDescription ?? null;
      const classification = classifyMpesaResult(response.ResultCode, rawMessage);
      if (classification.status === 'PENDING') {
        return {
          resultCode: null,
          resultMessage: rawMessage
        };
      }

      return {
        resultCode: String(response.ResultCode),
        resultMessage: rawMessage
      };
    }
  };
}

export const stkPushQueryAdapter = createStkPushQueryAdapter();

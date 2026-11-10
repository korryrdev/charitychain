import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { mpesaClient } from './mpesa.client.js';
import { mpesaConfig } from './mpesa.config.js';
import { mapStkRequest, mapStkResponse } from './mpesa.mapper.js';
export function createStkPushAdapter({ config = mpesaConfig, client = mpesaClient } = {}) { return { async initiate({ donation, phoneNumber }) { const body = await client.post(config.stkPushPath, mapStkRequest({ config, donation, phoneNumber })); const mapped = mapStkResponse(body); if (!mapped.providerRequestId) throw new AppError({ message: 'M-Pesa did not return a checkout reference.', code: ERROR_CODES.INTEGRATION_RESPONSE_INVALID, statusCode: 502 }); return mapped; } }; }
export const stkPushAdapter = createStkPushAdapter();

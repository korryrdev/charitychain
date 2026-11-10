import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { mpesaAuth } from './mpesa.auth.js';
import { mpesaConfig } from './mpesa.config.js';
export function createMpesaClient({ config = mpesaConfig, auth = mpesaAuth, fetchImpl = fetch } = {}) { return { async post(path, payload) { const token = await auth.token(); const response = await fetchImpl(`${config.baseUrl}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new AppError({ message: body.errorMessage ?? 'M-Pesa request failed.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 502, expose: true, retryable: response.status >= 500 }); return body; } }; }
export const mpesaClient = createMpesaClient();

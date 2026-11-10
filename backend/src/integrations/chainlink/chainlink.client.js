'use strict';
import { chainlinkConfig } from './chainlink.config.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
export function createChainlinkClient({ config = chainlinkConfig, fetchImpl = fetch } = {}) { return { async request(payload) { if (!config.enabled || !config.oracleUrl) throw new AppError({ message: 'Chainlink integration is disabled.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503, expose: true }); const response = await fetchImpl(config.oracleUrl, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${config.webhookSecret}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(config.requestTimeoutMs) }); const body = await response.json().catch(() => ({})); if (!response.ok || !body.requestId) throw new AppError({ message: 'Chainlink oracle request failed.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 502, expose: true, retryable: response.status >= 500 }); return body; } }; }
export const chainlinkClient = createChainlinkClient();

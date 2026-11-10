import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/environment.js';
import { integrationsConfig } from '../../config/integrations.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { digestPayload } from './paymentIdempotency.service.js';

function invalid(message = 'Provider callback authentication failed.') { return new AppError({ message, code: ERROR_CODES.CALLBACK_INVALID, statusCode: 401, expose: true }); }
export function providerEventSecret(provider) { return provider === 'BANK' ? (integrationsConfig.bank.webhookSecret ?? (integrationsConfig.bank.provider === 'sandbox' ? env.SESSION_SECRET : null)) : env.SESSION_SECRET; }
export function signProviderEvent(payload, secret) { return createHmac('sha256', secret).update(digestPayload(payload)).digest('hex'); }
export function verifyProviderEvent(payload, signature, secret) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature ?? '')) throw invalid();
  const expected = Buffer.from(signProviderEvent(payload, secret), 'hex'); const actual = Buffer.from(signature, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw invalid();
  return { payloadDigest: digestPayload(payload), signatureDigest: digestPayload(signature) };
}

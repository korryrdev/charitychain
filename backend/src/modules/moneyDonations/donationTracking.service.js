import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { authenticationConfig } from '../../config/authentication.js';

function hashSecret(secret) {
  return createHmac('sha256', authenticationConfig.session.secret).update(secret).digest('hex');
}

export function createTrackingCredentials(seed) {
  const trackingId = `MAL-${randomBytes(9).toString('base64url').toUpperCase()}`;
  const secret = seed
    ? createHmac('sha256', authenticationConfig.session.secret)
        .update(`tracking-secret:${seed}`)
        .digest('base64url')
    : randomBytes(24).toString('base64url');
  return Object.freeze({ trackingId, secret, secretHash: hashSecret(secret) });
}

export function verifyTrackingSecret(secret, expectedHash) {
  if (typeof secret !== 'string' || typeof expectedHash !== 'string') return false;
  const actual = Buffer.from(hashSecret(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

import { createHash, timingSafeEqual } from 'node:crypto';
import { securityConfig } from '../config/security.js';
export const hashToken = (token, secret = securityConfig.encryptionKey) => createHash('sha256').update(`${secret}:${String(token)}`).digest('hex');
export const tokenMatches = (token, digest, secret = securityConfig.encryptionKey) => { const expected = Buffer.from(hashToken(token, secret)); const actual = Buffer.from(String(digest)); return expected.length === actual.length && timingSafeEqual(expected, actual); };

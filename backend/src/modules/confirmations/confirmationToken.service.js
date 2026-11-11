import { createHmac, randomBytes } from 'node:crypto';
import { env } from '../../config/environment.js';
export function hashConfirmationToken(token, secret = env.SESSION_SECRET) { return createHmac('sha256', secret).update(token).digest('hex'); }
export function createConfirmationToken(secret = env.SESSION_SECRET) { const token = randomBytes(32).toString('base64url'); return { token, tokenHash: hashConfirmationToken(token, secret), tokenPrefix: token.slice(0, 8) }; }

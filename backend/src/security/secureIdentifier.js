import { randomBytes, randomUUID } from 'node:crypto';
export const createSecureId = () => randomUUID();
export const createOpaqueToken = (bytes = 32) => { if (!Number.isInteger(bytes) || bytes < 16 || bytes > 128) throw new RangeError('Token size must be between 16 and 128 bytes.'); return randomBytes(bytes).toString('base64url'); };

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { securityConfig } from '../config/security.js';
function key(value) { return createHash('sha256').update(value).digest(); }
export function encryptString(value, secret = securityConfig.encryptionKey) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(secret), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`; }
export function decryptString(value, secret = securityConfig.encryptionKey) { const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64url')); const decipher = createDecipheriv('aes-256-gcm', key(secret), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'); }
export function blindIndex(value, secret = securityConfig.encryptionKey) { return createHash('sha256').update(`${secret}:${value}`).digest('hex'); }

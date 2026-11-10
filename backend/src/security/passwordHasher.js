import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) { if (typeof password !== 'string' || password.length < 12) throw new TypeError('Passwords must contain at least 12 characters.'); const salt = randomBytes(16); const derived = await scrypt(password, salt, 64); return `scrypt$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`; }
export async function verifyPassword(password, encoded) { try { const [algorithm, salt, digest] = String(encoded).split('$'); if (algorithm !== 'scrypt' || !salt || !digest) return false; const expected = Buffer.from(digest, 'base64url'); const actual = Buffer.from(await scrypt(password, Buffer.from(salt, 'base64url'), expected.length)); return actual.length === expected.length && timingSafeEqual(actual, expected); } catch { return false; } }

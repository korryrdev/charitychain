import { timingSafeEqual } from 'node:crypto';
export function sessionIsValid(session, { now = new Date(), idleTimeoutMinutes = 30 } = {}) { if (!session?.id || session.revokedAt || session.expiresAt <= now) return false; return !session.lastActiveAt || new Date(session.lastActiveAt).getTime() + idleTimeoutMinutes * 60_000 > now.getTime(); }
export function sessionFingerprintMatches(expected, actual) { const left = Buffer.from(String(expected ?? '')); const right = Buffer.from(String(actual ?? '')); return left.length === right.length && timingSafeEqual(left, right); }

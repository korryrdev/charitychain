'use strict';
import { createHmac, timingSafeEqual } from 'node:crypto';
export function validateOracleResult({ rawBody, signature, secret }) { if (!rawBody || !signature || !secret) return false; const expected = createHmac('sha256', secret).update(rawBody).digest('hex'); const left = Buffer.from(expected, 'hex'); const right = Buffer.from(signature.replace(/^sha256=/, ''), 'hex'); return left.length === right.length && timingSafeEqual(left, right); }

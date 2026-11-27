'use strict';

import { randomBytes } from 'node:crypto';

// Crockford Base32 alphabet (excludes I, L, O, U to prevent visual confusion and accidental words)
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates an 8-character high-entropy receipt code formatted as MLK-XXXX-XXXX.
 * (PRD Section 7.1, FR-INT-10, G08)
 *
 * @returns {string} e.g. "MLK-7F3K-92QD"
 */
export function generateReceiptCode() {
  const bytes = randomBytes(8);
  let chars = '';
  for (let i = 0; i < 8; i++) {
    chars += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return `MLK-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/**
 * Validates whether a code matches the Malkia receipt code format (MLK-XXXX-XXXX)
 * or a standard Safaricom M-Pesa transaction reference (e.g. NL32X9P1AA).
 * (FR-INT-11)
 *
 * @param {string} code
 * @returns {boolean}
 */
export function isValidReceiptCode(code) {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim().toUpperCase();

  // MLK format: MLK-XXXX-XXXX (with or without dash)
  const isMlkFormat = /^MLK-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trimmed) || /^MLK[A-Z0-9]{8}$/.test(trimmed);
  if (isMlkFormat) return true;

  // Standard Safaricom M-Pesa transaction ID: 10 alphanumeric chars (e.g. NL32X9P1AA)
  const isMpesaRef = /^[A-Z0-9]{10}$/.test(trimmed);
  if (isMpesaRef) return true;

  // Standard alphanumeric tracking codes (12-16 chars)
  return /^[A-Z0-9_-]{8,20}$/.test(trimmed);
}

/**
 * Normalizes a receipt code string for lookups.
 *
 * @param {string} code
 * @returns {string}
 */
export function normalizeReceiptCode(code) {
  if (!code || typeof code !== 'string') return '';
  let upper = code.trim().toUpperCase();
  if (/^MLK[A-Z0-9]{8}$/.test(upper)) {
    upper = `MLK-${upper.slice(3, 7)}-${upper.slice(7, 11)}`;
  }
  return upper;
}

export default {
  generateReceiptCode,
  isValidReceiptCode,
  normalizeReceiptCode
};


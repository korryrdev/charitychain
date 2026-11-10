'use strict';

import { createHmac } from 'node:crypto';
import { env } from '../config/environment.js';

/**
 * Default secret for keyed HMAC hashes.
 */
const getSecret = () => process.env.REF_HASH_SECRET || env.ENCRYPTION_KEY || 'default-charitychain-ref-secret-32b!';

/**
 * Canonical keyed reference hash as defined in ARCHITECTURE.md 5.5:
 * refHash(kind, value) = HMAC_SHA256(serverSecret, "malkia:v1:" + kind + ":" + value) as bytes32 hex ("0x" + 64 hex chars).
 *
 * @param {'donor'|'source'} kind
 * @param {string} value
 * @param {string} [secret]
 * @returns {string}
 */
export function refHash(kind, value, secret = getSecret()) {
  const message = `malkia:v1:${kind}:${String(value).trim()}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(message, 'utf8');
  return `0x${hmac.digest('hex')}`;
}

/**
 * Normalizes phone numbers, emails, or bank reference strings into canonical form.
 *
 * @param {string} raw
 * @param {'phone'|'email'|'bank'} [type='phone']
 * @returns {string}
 */
export function normalizeIdentity(raw, type = 'phone') {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();

  if (type === 'email') {
    return trimmed.toLowerCase();
  }

  if (type === 'phone') {
    // Keep digits only
    const digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
      return `254${digits.slice(1)}`;
    }
    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }
    return digits || trimmed;
  }

  // Bank or arbitrary reference
  return trimmed.toUpperCase();
}

/**
 * Computes a pseudonymous donor reference bytes32 from raw identifier.
 * FR-DON-01: Every donation is linked to a pseudonymous donor reference;
 * no donor name or phone appears on public ledger.
 *
 * @param {string} rawIdentity
 * @param {'phone'|'email'|'bank'} [type='phone']
 * @returns {string} bytes32 hex
 */
export function computeDonorRef(rawIdentity, type = 'phone') {
  const normalized = normalizeIdentity(rawIdentity, type);
  return refHash('donor', normalized);
}

/**
 * Computes a source reference hash bytes32 for M-Pesa receipt codes or bank references.
 *
 * @param {string} sourceRef
 * @returns {string} bytes32 hex
 */
export function computeSourceRefHash(sourceRef) {
  return refHash('source', String(sourceRef).trim().toUpperCase());
}

/**
 * Default donor preferences per FR-DON-02 & D9:
 * Default mode is ANONYMOUS, no account needed.
 */
export const DEFAULT_DONOR_PREFERENCES = Object.freeze({
  displayMode: 'ANONYMOUS',
  publicAlias: null,
  confirmedName: null,
  isOptedIn: false,
  consentVersion: null
});

export default {
  refHash,
  normalizeIdentity,
  computeDonorRef,
  computeSourceRefHash,
  DEFAULT_DONOR_PREFERENCES
};

import { describe, it, expect } from 'vitest';
import {
  refHash,
  normalizeIdentity,
  computeDonorRef,
  computeSourceRefHash,
  DEFAULT_DONOR_PREFERENCES
} from '../../src/security/donorReference.js';

describe('G06: Donor Reference Model (D9, FR-DON-01, FR-DON-02)', () => {
  it('FR-DON-01: generates deterministic bytes32 keyed hashes for donor references', () => {
    const phone = '0712345678';
    const donorRef1 = computeDonorRef(phone, 'phone');
    const donorRef2 = computeDonorRef('+254712345678', 'phone');

    expect(donorRef1).toMatch(/^0x[a-f0-9]{64}$/);
    // Both phone formats normalize to 254712345678 and yield the exact same donorRef
    expect(donorRef1).toBe(donorRef2);
  });

  it('normalizes emails to lowercase before hashing', () => {
    const email1 = 'Supporter@Malkia.org';
    const email2 = 'supporter@malkia.org';

    expect(computeDonorRef(email1, 'email')).toBe(computeDonorRef(email2, 'email'));
  });

  it('computes sourceRefHash for transaction receipts and bank references', () => {
    const mpesaCode = 'NL32X9P1AA';
    const hash = computeSourceRefHash(mpesaCode);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hash).toBe(computeSourceRefHash('nl32x9p1aa'));
  });

  it('FR-DON-02: provides ANONYMOUS display mode as system default with no account required', () => {
    expect(DEFAULT_DONOR_PREFERENCES.displayMode).toBe('ANONYMOUS');
    expect(DEFAULT_DONOR_PREFERENCES.isOptedIn).toBe(false);
    expect(DEFAULT_DONOR_PREFERENCES.publicAlias).toBeNull();
  });
});

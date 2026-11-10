import { describe, expect, it } from 'vitest';
import { canonicalEvidenceService } from '../../src/modules/evidence/canonicalEvidence.service.js';
import { createEvidenceEncryptionService } from '../../src/modules/evidence/evidenceEncryption.service.js';

describe('evidence canonicalization and encryption', () => {
  it('produces the same digest regardless of object key insertion order', () => {
    const first = canonicalEvidenceService.create({ subjectType: 'DONATION', subjectId: 'id', evidenceType: 'DONATION_RECEIPT', content: { z: 1, a: { y: 2, b: 3 } } });
    const second = canonicalEvidenceService.create({ subjectType: 'DONATION', subjectId: 'id', evidenceType: 'DONATION_RECEIPT', content: { a: { b: 3, y: 2 }, z: 1 } });
    expect(first.digest).toBe(second.digest);
    expect(first.canonical).toBe(second.canonical);
  });

  it('authenticates ciphertext and digest with AES-256-GCM', () => {
    const encryption = createEvidenceEncryptionService('a-secure-test-key-that-is-at-least-thirty-two-characters');
    const plaintext = '{"protected":true}';
    const digest = 'a'.repeat(64);
    const envelope = encryption.encrypt(plaintext, digest);
    expect(encryption.decrypt(envelope, digest)).toBe(plaintext);
    expect(() => encryption.decrypt(envelope, 'b'.repeat(64))).toThrow();
  });
});

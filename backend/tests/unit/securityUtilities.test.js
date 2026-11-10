import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createKeyRing } from '../../src/security/keyVersions.js';
import { decryptString, encryptString } from '../../src/security/encryption.js';
import { hashPassword, verifyPassword } from '../../src/security/passwordHasher.js';
import { createReplayProtector } from '../../src/security/replayProtector.js';
import { redactSensitiveData } from '../../src/security/sensitiveDataRedactor.js';
import { hashToken, tokenMatches } from '../../src/security/tokenHasher.js';
import { verifyWebhookSignature } from '../../src/security/webhookVerifier.js';

describe('Section 35 security utilities', () => {
  it('encrypts with a key version and preserves legacy decryption compatibility', () => {
    const ring = createKeyRing({ activeVersion: 'v2', keys: { v1: 'a'.repeat(32), v2: 'b'.repeat(32) } });
    const encrypted = encryptString('254700000000', ring);
    expect(encrypted.startsWith('v2.')).toBe(true);
    expect(decryptString(encrypted, ring)).toBe('254700000000');
    const legacy = encryptString('legacy-value', 'a'.repeat(32)).split('.').slice(1).join('.');
    expect(decryptString(legacy, ring)).toBe('legacy-value');
  });

  it('uses slow password hashing, constant-time token checks, and HMAC webhook validation', async () => {
    const encoded = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', encoded)).resolves.toBe(true);
    await expect(verifyPassword('incorrect password value', encoded)).resolves.toBe(false);
    const digest = hashToken('one-time-token', 's'.repeat(32));
    expect(tokenMatches('one-time-token', digest, 's'.repeat(32))).toBe(true);
    expect(tokenMatches('different-token', digest, 's'.repeat(32))).toBe(false);
    const body = '{"event":"paid"}'; const secret = 'webhook-secret'; const signature = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyWebhookSignature({ rawBody: body, signature, secret })).toBe(true);
    expect(verifyWebhookSignature({ rawBody: body, signature: 'bad', secret })).toBe(false);
  });

  it('blocks replayed identifiers and redacts nested sensitive values', () => {
    let now = 1000; const replay = createReplayProtector({ clock: () => now });
    expect(replay.claim('provider:evt-1', 500)).toBe(true);
    expect(replay.claim('provider:evt-1', 500)).toBe(false);
    now += 501; expect(replay.claim('provider:evt-1', 500)).toBe(true);
    expect(redactSensitiveData({ email: 'person@example.test', nested: { accessToken: 'secret', safe: 'value' } })).toEqual({ email: '[REDACTED]', nested: { accessToken: '[REDACTED]', safe: 'value' } });
  });
});

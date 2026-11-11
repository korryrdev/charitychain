'use strict';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/environment.js';

export function createEvidenceEncryptionService(secret = env.ENCRYPTION_KEY) {
  const key = createHash('sha256').update(secret, 'utf8').digest();
  return {
    encrypt(plaintext, digest) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(digest, 'utf8'));
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      return {
        algorithm: 'aes-256-gcm', version: 'v1', ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64')
      };
    },
    decrypt(envelope, digest) {
      if (envelope.version !== 'v1' || envelope.algorithm !== 'aes-256-gcm') throw new Error('Unsupported evidence encryption version.');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
      decipher.setAAD(Buffer.from(digest, 'utf8'));
      decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8');
    }
  };
}

export const evidenceEncryptionService = createEvidenceEncryptionService();

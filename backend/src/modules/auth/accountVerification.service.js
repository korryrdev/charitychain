import { createHash, randomBytes } from 'node:crypto';
import { authenticationConfig } from '../../config/authentication.js';
import { InvalidAuthTokenError } from './auth.errors.js';
import { authRepository } from './auth.repository.js';

const digest = (value) => createHash('sha256').update(value).digest('hex');

export function createAccountVerificationService({ repository = authRepository } = {}) {
  return {
    async issue(email) {
      const normalizedEmail = email.toLowerCase();
      const token = randomBytes(32).toString('base64url');
      const identifier = `account-verification:${normalizedEmail}`;
      await repository.deleteVerifications(identifier);
      await repository.createVerification({
        identifier,
        value: digest(token),
        expiresAt: new Date(Date.now() + authenticationConfig.accountVerificationTtlMs)
      });
      return token;
    },
    async verify(email, token) {
      const normalizedEmail = email.toLowerCase();
      const record = await repository.consumeVerification(
        `account-verification:${normalizedEmail}`,
        digest(token)
      );
      if (!record) throw new InvalidAuthTokenError();
      return repository.activateUser(normalizedEmail);
    }
  };
}

export const accountVerificationService = createAccountVerificationService();

import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { authenticationConfig } from '../../config/authentication.js';
import { STATUSES } from '../../constants/statuses.js';
import { InvalidAuthTokenError } from './auth.errors.js';
import { authRepository } from './auth.repository.js';

const digest = (value) => createHash('sha256').update(value).digest('hex');

export function createPasswordResetService({ repository = authRepository } = {}) {
  return {
    async issue(email) {
      const user = await repository.findUserByEmail(email);
      if (!user) return null;
      if (![STATUSES.USER.ACTIVE, STATUSES.USER.PENDING_VERIFICATION].includes(user.status)) {
        return null;
      }
      const token = randomBytes(32).toString('base64url');
      const identifier = `password-reset:${user.id}`;
      await repository.deleteVerifications(identifier);
      await repository.createVerification({
        identifier,
        value: digest(token),
        expiresAt: new Date(Date.now() + authenticationConfig.passwordResetTtlMs)
      });
      return { token, userId: user.id, name: user.name };
    },
    async reset(userId, token, password) {
      const record = await repository.consumeVerification(
        `password-reset:${userId}`,
        digest(token)
      );
      if (!record) throw new InvalidAuthTokenError();
      const hashedPassword = await hashPassword(password);
      await repository.updateCredentialPassword(userId, hashedPassword);
      // A reset replaces any temporary password and signs out every device.
      await repository.clearPasswordChangeRequirement(userId);
      await repository.revokeSessionsExcept(userId, null);
    }
  };
}

export const passwordResetService = createPasswordResetService();

import { createHash, randomBytes } from 'node:crypto';
import { authenticationConfig } from '../../config/authentication.js';
import { STATUSES } from '../../constants/statuses.js';
import { InvalidAuthTokenError } from './auth.errors.js';
import { authMailer } from './authMailer.js';
import { authRepository } from './auth.repository.js';
import { throttleService } from './throttle.service.js';

const digest = (value) => createHash('sha256').update(value).digest('hex');

export function createAccountVerificationService({
  repository = authRepository,
  throttle = throttleService,
  mailer = authMailer
} = {}) {
  const service = {
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
      const user = await repository.findUserByEmail(normalizedEmail);
      if (!user) throw new InvalidAuthTokenError();
      if (user.status === STATUSES.USER.ACTIVE) return user;
      // A verification token must never reactivate a suspended or disabled account.
      if (user.status !== STATUSES.USER.PENDING_VERIFICATION) throw new InvalidAuthTokenError();
      return repository.activateUser(normalizedEmail);
    },
    /**
     * Issues a fresh link for a pending account. Throttled per email and always
     * resolves the same way, so it cannot be used to discover registered emails.
     */
    async resend(email) {
      const normalizedEmail = email.trim().toLowerCase();
      await throttle.resendAllowed(normalizedEmail);
      const user = await repository.findUserByEmail(normalizedEmail);
      if (user?.status === STATUSES.USER.PENDING_VERIFICATION) {
        const token = await service.issue(normalizedEmail);
        await mailer.sendVerification({ email: normalizedEmail, token, user });
        return { sent: true, userId: user.id };
      }
      return { sent: false };
    }
  };
  return service;
}

export const accountVerificationService = createAccountVerificationService();

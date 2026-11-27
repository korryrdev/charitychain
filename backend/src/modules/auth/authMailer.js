import { authenticationConfig } from '../../config/authentication.js';
import { env } from '../../config/environment.js';
import { logger } from '../../observability/logger.js';
import { resendEmailService } from '../notifications/resendEmail.service.js';

const STUDENT_DOMAIN = '@students.must.ac.ke';

export const portalForEmail = (email) =>
  String(email ?? '').toLowerCase().endsWith(STUDENT_DOMAIN) ? 'student' : 'donor';

/**
 * Builds the portal-specific links that go into authentication emails and
 * sends them. Delivery failures are logged but never thrown: a provider
 * outage must not lose a registration or reveal whether an email exists.
 */
export function createAuthMailer({
  emailService = resendEmailService,
  appUrl = env.APP_URL,
  config = authenticationConfig,
  log = logger
} = {}) {
  const base = appUrl.replace(/\/$/, '');
  const verifyUrl = (email, token) => {
    const prefix = portalForEmail(email) === 'student' ? '/student/auth/verify' : '/auth/verify';
    return `${base}${prefix}?${new URLSearchParams({ token, email }).toString()}`;
  };
  const loginUrl = (email) =>
    `${base}${portalForEmail(email) === 'student' ? '/student/auth/login' : '/auth/login'}`;
  const resetUrl = (userId, token) =>
    `${base}/auth/reset-password?${new URLSearchParams({ userId, token }).toString()}`;

  async function safely(kind, operation) {
    try {
      return await operation();
    } catch (error) {
      log.error({ error, kind }, 'Authentication email could not be sent');
      return { delivery: 'FAILED' };
    }
  }

  return {
    verifyUrl,
    resetUrl,
    sendVerification({ email, token, user }) {
      return safely('verification', () =>
        emailService.sendAccountVerification({
          recipientName: user?.name,
          email,
          verifyUrl: verifyUrl(email, token),
          expiresInHours: Math.max(1, Math.round(config.accountVerificationTtlMs / 3_600_000)),
          idempotencyKey: `verify-${token.slice(0, 32)}`
        })
      );
    },
    sendPasswordReset({ email, token, userId, name }) {
      return safely('password-reset', () =>
        emailService.sendPasswordReset({
          recipientName: name,
          email,
          resetUrl: resetUrl(userId, token),
          expiresInMinutes: Math.max(1, Math.round(config.passwordResetTtlMs / 60_000)),
          idempotencyKey: `reset-${token.slice(0, 32)}`
        })
      );
    },
    sendAlreadyRegistered({ email, name }) {
      return safely('already-registered', () =>
        emailService.sendAlreadyRegistered({
          recipientName: name,
          email,
          loginUrl: loginUrl(email),
          resetUrl: `${base}/auth/password-recovery`
        })
      );
    }
  };
}

export const authMailer = createAuthMailer();

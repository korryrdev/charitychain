import { deepFreeze, env } from './environment.js';

export function createAuthenticationConfig(environment = env) {
  return deepFreeze({
    session: {
      secret: environment.SESSION_SECRET,
      cookieName: environment.SESSION_COOKIE_NAME,
      ttlMs: environment.SESSION_TTL_MINUTES * 60_000,
      idleTimeoutMs: environment.SESSION_IDLE_TIMEOUT_MINUTES * 60_000,
      cookie: {
        httpOnly: true,
        secure: environment.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      }
    },
    passwordResetTtlMs: environment.PASSWORD_RESET_TTL_MINUTES * 60_000,
    accountVerificationTtlMs: environment.ACCOUNT_VERIFICATION_TTL_MINUTES * 60_000,
    mfaIssuer: environment.MFA_ISSUER,
    maxLoginAttempts: environment.MAX_LOGIN_ATTEMPTS,
    accountLockMs: environment.ACCOUNT_LOCK_MINUTES * 60_000
  });
}

export const authenticationConfig = createAuthenticationConfig();

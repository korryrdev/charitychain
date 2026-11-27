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
    temporaryPasswordTtlMs: environment.TEMP_PASSWORD_TTL_HOURS * 3_600_000,
    throttle: {
      lockScheduleSeconds: environment.AUTH_LOCK_SCHEDULE_SECONDS.split(',').map(Number),
      ipLoginPerMinute: environment.AUTH_IP_LOGIN_PER_MINUTE,
      registerPerHour: environment.AUTH_REGISTER_PER_HOUR,
      resendCooldownSeconds: environment.AUTH_RESEND_COOLDOWN_SECONDS,
      resendPerHour: environment.AUTH_RESEND_PER_HOUR,
      resetPerHour: environment.AUTH_RESET_PER_HOUR
    },
    mfaIssuer: environment.MFA_ISSUER,
    maxLoginAttempts: environment.MAX_LOGIN_ATTEMPTS,
    accountLockMs: environment.ACCOUNT_LOCK_MINUTES * 60_000
  });
}

export const authenticationConfig = createAuthenticationConfig();

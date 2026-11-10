import { deepFreeze, env } from './environment.js';

export function createSecurityConfig(environment = env) {
  return deepFreeze({
    encryptionKey: environment.ENCRYPTION_KEY,
    trustProxy: environment.TRUST_PROXY,
    jsonBodyLimit: environment.JSON_BODY_LIMIT,
    rateLimit: {
      windowMs: environment.RATE_LIMIT_WINDOW_MS,
      maximumRequests: environment.RATE_LIMIT_MAX_REQUESTS
    },
    headers: {
      contentSecurityPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' }
    }
  });
}

export const securityConfig = createSecurityConfig();

import { prisma } from '@charitychain/database';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { authenticationConfig } from '../../config/authentication.js';
import { env } from '../../config/environment.js';
import { STATUSES } from '../../constants/statuses.js';

export function createAuthEngine({ database = prisma } = {}) {
  return betterAuth({
    appName: env.APP_NAME,
    baseURL: env.API_URL,
    basePath: '/api/v1/public/auth/provider',
    secret: authenticationConfig.session.secret,
    trustedOrigins: [env.APP_URL],
    database: prismaAdapter(database, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false
    },
    user: {
      additionalFields: {
        status: {
          type: Object.values(STATUSES.USER),
          required: false,
          defaultValue: STATUSES.USER.PENDING_VERIFICATION,
          input: false
        }
      }
    },
    session: {
      expiresIn: Math.floor(authenticationConfig.session.ttlMs / 1000),
      updateAge: Math.floor(authenticationConfig.session.idleTimeoutMs / 1000),
      cookieCache: { enabled: false }
    },
    advanced: {
      database: { generateId: 'uuid', joins: true },
      useSecureCookies: env.NODE_ENV === 'production',
      cookies: {
        session_token: {
          name: authenticationConfig.session.cookieName,
          attributes: authenticationConfig.session.cookie
        }
      }
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await database.user.findUnique({
              where: { id: session.userId },
              select: { status: true }
            });
            return user?.status === STATUSES.USER.ACTIVE ? { data: session } : false;
          }
        }
      }
    },
    plugins: [
      twoFactor({
        issuer: authenticationConfig.mfaIssuer,
        totpOptions: { period: 30, digits: 6 },
        backupCodeOptions: { amount: 10, length: 10 },
        accountLockout: {
          enabled: true,
          maxFailedAttempts: authenticationConfig.maxLoginAttempts,
          durationSeconds: Math.floor(authenticationConfig.accountLockMs / 1000)
        }
      })
    ]
  });
}

export const authEngine = createAuthEngine();

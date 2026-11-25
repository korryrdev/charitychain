import { authenticationConfig } from '../config/authentication.js';
import { STATUSES } from '../constants/statuses.js';
import { AuthenticationError } from '../errors/AuthenticationError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

function extractSessionToken(request, cookieName) {
  const authorization = request.get('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();
  const cookie = request.cookies?.[cookieName] ?? null;
  // Better Auth signs the browser cookie as `token.signature`; the database
  // session identifier is the first segment. Cookie-parser has already URL-
  // decoded it at this point.
  return typeof cookie === 'string' ? cookie.split('.', 1)[0] : null;
}

export function createAuthenticate({
  resolveSession = async () => null,
  cookieName = authenticationConfig.session.cookieName
} = {}) {
  return async function authenticate(request, _response, next) {
    try {
      const token = extractSessionToken(request, cookieName);
      if (!token || token.length < 32 || token.length > 512) throw new AuthenticationError();

      const authentication = await resolveSession(token, { requestId: request.id });
      if (!authentication?.user || !authentication?.session) {
        throw new AuthenticationError('The session is invalid or has expired.', {
          code: ERROR_CODES.SESSION_EXPIRED
        });
      }
      const expiresAt = new Date(authentication.session.expiresAt);
      if (
        authentication.session.revokedAt ||
        Number.isNaN(expiresAt.getTime()) ||
        expiresAt <= new Date()
      ) {
        throw new AuthenticationError('The session is invalid or has expired.', {
          code: ERROR_CODES.SESSION_EXPIRED
        });
      }
      if (authentication.user.status !== STATUSES.USER.ACTIVE) {
        throw new AuthenticationError('This account is not active.', {
          code:
            authentication.user.status === STATUSES.USER.LOCKED
              ? ERROR_CODES.ACCOUNT_LOCKED
              : ERROR_CODES.ACCOUNT_NOT_VERIFIED
        });
      }

      request.auth = Object.freeze({
        user: authentication.user,
        session: authentication.session,
        roles: Object.freeze([...(authentication.roles ?? [])]),
        permissions: Object.freeze([...(authentication.permissions ?? [])]),
        mfaVerified: Boolean(authentication.mfaVerified)
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authenticate = createAuthenticate();

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { authenticationConfig } from '../config/authentication.js';
import { AuthorizationError } from '../errors/AuthorizationError.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const unauthenticatedAuthPaths = new Set([
  '/api/v1/public/auth/register',
  '/api/v1/public/auth/register-student',
  '/api/v1/public/auth/verify-account',
  '/api/v1/public/auth/resend-verification',
  '/api/v1/public/auth/login',
  '/api/v1/public/auth/password-reset/request',
  '/api/v1/public/auth/password-reset/complete'
]);

const csrfExemptPrefixes = ['/api/v1/daraja/', '/api/v1/webhooks/'];

function tokensMatch(first, second) {
  if (typeof first !== 'string' || typeof second !== 'string') return false;
  if (first.length < 32 || first.length > 512 || first.length !== second.length) return false;
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  if (firstBuffer.length !== secondBuffer.length) return false;
  return timingSafeEqual(firstBuffer, secondBuffer);
}

export function createCsrfProtection({
  cookieName = 'charitychain_csrf',
  sessionCookieName = authenticationConfig.session.cookieName,
  headerName = 'x-csrf-token'
} = {}) {
  return function csrfProtection(request, response, next) {
    const requestPath = request.originalUrl?.split('?')[0] ?? '';
    // A persisted session can outlive a browser's non-HttpOnly CSRF cookie.
    // Reissue it during a safe authenticated request so the next mutation can
    // satisfy the double-submit check without weakening it.
    if (
      safeMethods.has(request.method) &&
      request.cookies?.[sessionCookieName] &&
      !request.cookies?.[cookieName]
    ) {
      response.cookie(cookieName, randomBytes(32).toString('base64url'), {
        httpOnly: false,
        secure: authenticationConfig.session.cookie.secure,
        sameSite: authenticationConfig.session.cookie.sameSite,
        path: '/'
      });
    }
    if (
      safeMethods.has(request.method) ||
      unauthenticatedAuthPaths.has(requestPath) ||
      csrfExemptPrefixes.some((prefix) => requestPath.startsWith(prefix)) ||
      request.get('authorization')?.startsWith('Bearer ') ||
      !request.cookies?.[sessionCookieName]
    ) {
      return next();
    }

    const cookieToken = request.cookies?.[cookieName];
    const headerToken = request.get(headerName);
    if (!tokensMatch(cookieToken, headerToken)) {
      return next(new AuthorizationError('The CSRF token is missing or invalid.'));
    }
    return next();
  };
}

export const csrfProtection = createCsrfProtection();

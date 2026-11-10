import { timingSafeEqual } from 'node:crypto';
import { AuthorizationError } from '../errors/AuthorizationError.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const unauthenticatedAuthPaths = new Set([
  '/api/v1/public/auth/register',
  '/api/v1/public/auth/verify-account',
  '/api/v1/public/auth/login',
  '/api/v1/public/auth/password-reset/request',
  '/api/v1/public/auth/password-reset/complete'
]);

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
  sessionCookieName = 'charitychain_session',
  headerName = 'x-csrf-token'
} = {}) {
  return function csrfProtection(request, _response, next) {
    const requestPath = request.originalUrl?.split('?')[0];
    if (
      safeMethods.has(request.method) ||
      unauthenticatedAuthPaths.has(requestPath) ||
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

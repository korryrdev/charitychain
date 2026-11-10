import { AuthenticationError } from '../errors/AuthenticationError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export function requireMfa(request, _response, next) {
  if (!request.auth) return next(new AuthenticationError());
  if (!request.auth.mfaVerified) {
    return next(
      new AuthenticationError('Multi-factor authentication is required for this action.', {
        code: ERROR_CODES.MFA_REQUIRED
      })
    );
  }
  return next();
}

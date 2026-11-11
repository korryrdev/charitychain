import { AuthorizationError } from '../errors/AuthorizationError.js';
import { AuthenticationError } from '../errors/AuthenticationError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export function authorize(...requiredPermissions) {
  if (requiredPermissions.length === 0) throw new TypeError('At least one permission is required.');

  return function authorizationMiddleware(request, _response, next) {
    if (!request.auth) return next(new AuthenticationError());
    const grantedPermissions = new Set(request.auth.permissions ?? []);
    const missingPermissions = requiredPermissions.filter(
      (permission) => !grantedPermissions.has(permission)
    );
    if (missingPermissions.length > 0) {
      return next(
        new AuthorizationError('You do not have permission to perform this action.', {
          code: ERROR_CODES.PERMISSION_DENIED,
          details: { requiredPermissions: missingPermissions }
        })
      );
    }
    return next();
  };
}

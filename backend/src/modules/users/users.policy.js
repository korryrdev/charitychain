import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';

export function assertCanReadUser(auth, userId) {
  if (auth.user.id === userId || auth.permissions.includes(PERMISSIONS.USER_MANAGE)) return;
  throw new AuthorizationError();
}

export function assertCanUpdateUser(auth, userId) {
  if (auth.user.id === userId || auth.permissions.includes(PERMISSIONS.USER_MANAGE)) return;
  throw new AuthorizationError();
}

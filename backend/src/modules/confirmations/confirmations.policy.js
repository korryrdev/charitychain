import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanCreateConfirmation(auth) { if (!auth.permissions.includes(PERMISSIONS.CONFIRMATION_MANAGE)) throw new AuthorizationError(); }

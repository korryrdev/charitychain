import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanExecuteVetting(auth) { if (!auth.permissions.includes(PERMISSIONS.VETTING_EXECUTE)) throw new AuthorizationError(); }
export function assertCanManageVettingPolicy(auth) { if (!auth.permissions.includes(PERMISSIONS.VETTING_POLICY_MANAGE)) throw new AuthorizationError(); }
export function assertCanReadVetting(auth, run) { if (run.application?.student?.userId === auth.user.id || auth.permissions.some((permission) => [PERMISSIONS.VETTING_EXECUTE, PERMISSIONS.APPLICATION_REVIEW].includes(permission))) return; throw new AuthorizationError(); }

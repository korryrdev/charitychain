import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanCreate(auth) { if (!auth.permissions.includes(PERMISSIONS.APPLICATION_CREATE)) throw new AuthorizationError(); }
export function assertCanRead(auth, application) { if ((application.student.userId && application.student.userId === auth.user.id) || auth.permissions.includes(PERMISSIONS.APPLICATION_REVIEW)) return; throw new AuthorizationError(); }
export function assertOwns(auth, application) { if (application.student.userId !== auth.user.id) throw new AuthorizationError(); }
export function assertCanReview(auth) { if (!auth.permissions.includes(PERMISSIONS.APPLICATION_REVIEW)) throw new AuthorizationError(); }

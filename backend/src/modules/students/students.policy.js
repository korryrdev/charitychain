import { AuthorizationError } from '../../errors/AuthorizationError.js';
import { PERMISSIONS } from '../../constants/permissions.js';

// A verified account can ask to link its own university record. The record is
// still claimed once only, and a successful claim grants the Student capability.
export function assertCanClaim(auth) { if (!auth?.user?.id) throw new AuthorizationError(); }
export function assertCanReadStudent(auth, student) { if ((student.userId && student.userId === auth.user.id) || auth.permissions.includes(PERMISSIONS.STUDENT_RECORD_READ_ALL)) return; throw new AuthorizationError(); }
export function assertCanManageStudents(auth) { if (!auth.permissions.includes(PERMISSIONS.STUDENT_RECORD_MANAGE)) throw new AuthorizationError(); }

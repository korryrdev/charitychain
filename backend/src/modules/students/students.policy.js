import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanClaim(auth) { if (!auth.permissions.includes(PERMISSIONS.STUDENT_RECORD_READ_SELF)) throw new AuthorizationError(); }
export function assertCanReadStudent(auth, student) { if ((student.userId && student.userId === auth.user.id) || auth.permissions.includes(PERMISSIONS.STUDENT_RECORD_READ_ALL)) return; throw new AuthorizationError(); }
export function assertCanManageStudents(auth) { if (!auth.permissions.includes(PERMISSIONS.STUDENT_RECORD_MANAGE)) throw new AuthorizationError(); }

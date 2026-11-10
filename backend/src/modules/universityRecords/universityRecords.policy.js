import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
export function assertCanReadUniversityRecord(auth, student) { if ((student.userId && student.userId === auth.user.id) || auth.permissions.includes(PERMISSIONS.STUDENT_RECORD_READ_ALL)) return; throw new AuthorizationError(); }

import { PERMISSIONS } from '../../constants/permissions.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
export function requirePermission(auth, permission) { if (!auth.permissions.includes(permission)) throw new AuthorizationError(); }
export function assertRecordAccess(auth) { requirePermission(auth, PERMISSIONS.PHYSICAL_DONATION_RECORD); }
export function assertInspectionAccess(auth, donation) { requirePermission(auth, PERMISSIONS.PHYSICAL_DONATION_INSPECT); if (donation.clerkUserId === auth.user.id) throw new ConflictError('The recording clerk cannot inspect the same donation.'); }
export function assertStatus(donation, statuses) { if (!statuses.includes(donation.status)) throw new ConflictError(`Physical donation is ${donation.status}; expected ${statuses.join(' or ')}.`); }

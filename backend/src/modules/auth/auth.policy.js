import { STATUSES } from '../../constants/statuses.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

export const PORTALS = Object.freeze(['student', 'donor', 'staff']);
const NON_STAFF_ROLES = new Set(['STUDENT', 'DONOR']);
const ROLE_TO_PORTAL = Object.freeze({
  STUDENT: 'student',
  DONOR: 'donor',
  ADMIN: 'staff',
  SECRETARIAT: 'staff'
});

/** Roles whose holders must have multi-factor authentication enrolled. */
export const MFA_REQUIRED_ROLES = Object.freeze(
  new Set([
    'ADMINISTRATOR',
    'SYSTEM_ADMIN',
    'COMMITTEE_MEMBER',
    'SIGNATORY',
    'SUBGROUP_REP',
    'TREASURER'
  ])
);

export function resolvePortal(input = {}) {
  return input.portal ?? ROLE_TO_PORTAL[input.role] ?? null;
}

export function portalAllowsRoles(portal, roles) {
  if (!portal) return true;
  if (portal === 'student') return roles.includes('STUDENT');
  if (portal === 'donor') return roles.includes('DONOR');
  return roles.some((role) => !NON_STAFF_ROLES.has(role));
}

export function requiresMfaEnrollment(user, roles) {
  return !user?.twoFactorEnabled && roles.some((role) => MFA_REQUIRED_ROLES.has(role));
}

/** Call only after the password has been verified. */
export function assertUserCanSignIn(user) {
  if (!user)
    throw new AuthenticationError('The email or password is incorrect.', {
      code: ERROR_CODES.INVALID_CREDENTIALS
    });
  if (user.status === STATUSES.USER.PENDING_VERIFICATION) {
    throw new AuthenticationError('Please verify your email address before signing in.', {
      code: ERROR_CODES.ACCOUNT_NOT_VERIFIED
    });
  }
  if (user.status !== STATUSES.USER.ACTIVE) {
    throw new AuthenticationError('This account cannot sign in. Please contact support.', {
      code: ERROR_CODES.ACCOUNT_LOCKED
    });
  }
}

export function assertTemporaryPasswordValid(user, now = new Date()) {
  if (
    user.mustChangePassword &&
    user.temporaryPasswordExpiresAt &&
    new Date(user.temporaryPasswordExpiresAt) <= now
  ) {
    throw new AuthenticationError(
      'Your temporary password has expired. Use "Forgot password" to set a new one.',
      { code: ERROR_CODES.TEMP_PASSWORD_EXPIRED }
    );
  }
}

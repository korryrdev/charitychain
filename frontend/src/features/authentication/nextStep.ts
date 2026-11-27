import { defaultAuthorizedPath } from '../authorization/permissions';
import type { AuthResponse, PortalSession } from '../../types/portal';

export const CHANGE_PASSWORD_PATH = '/auth/change-password';
export const MFA_SETUP_PATH = '/auth/mfa-setup';
export const MFA_CHALLENGE_PATH = '/auth/mfa';

/** Role home with fallbacks for responses that carry only a single `role` string. */
export function roleHomePath(response: AuthResponse | PortalSession | null | undefined): string {
  const authorized = defaultAuthorizedPath(response);
  if (authorized !== '/') return authorized;
  const roles = response?.roles ?? [];
  if (roles.includes('STUDENT')) return '/student';
  if (roles.includes('DONOR')) return '/donor';
  const role = (response as AuthResponse | undefined)?.role;
  if (role === 'STUDENT') return '/student';
  if (role === 'DONOR') return '/donor';
  return '/';
}

/** The page a freshly authenticated user must visit next: MFA challenge, forced password change, MFA enrolment, then home. */
export function nextAuthPath(response: AuthResponse | null | undefined, from?: string): string {
  const flags = { ...response?.user, ...(response ?? {}) };
  if (response?.requiresMfa || response?.twoFactorRedirect) return MFA_CHALLENGE_PATH;
  if (flags.mustChangePassword || response?.user?.mustChangePassword) return CHANGE_PASSWORD_PATH;
  if (flags.mfaEnrollmentRequired || response?.user?.mfaEnrollmentRequired) return MFA_SETUP_PATH;
  return from ?? roleHomePath(response);
}

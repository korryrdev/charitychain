import type { LoginPortalCode } from './services/auth.api';

/** Role code understood by `validatePortalEmail` (students need the MUST address pattern). */
type EmailRule = 'STUDENT' | 'DONOR' | 'ADMIN';

export interface PortalConfig {
  portal: LoginPortalCode;
  emailRule: EmailRule;
  /** Role that must be present on the session for this portal, or null for staff (any non-student/donor role). */
  expectedRole: 'STUDENT' | 'DONOR' | null;
  kicker: string;
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  emailPlaceholder: string;
  emailHint?: string;
  loginPath: string;
  registerPath: string | null;
  checkEmailPath: string;
  verifyPath: string;
}

export const PORTALS: Readonly<Record<LoginPortalCode, PortalConfig>> = Object.freeze({
  student: {
    portal: 'student',
    emailRule: 'STUDENT',
    expectedRole: 'STUDENT',
    kicker: 'Student access',
    loginTitle: 'Student sign in',
    loginSubtitle: 'Use your MUST student email to open your support portal.',
    registerTitle: 'Create your student account',
    registerSubtitle: 'Sign up with your MUST student email and registration number.',
    emailPlaceholder: 'name123456@students.must.ac.ke',
    emailHint: 'Format: name123456@students.must.ac.ke',
    loginPath: '/student/auth/login',
    registerPath: '/student/auth/register',
    checkEmailPath: '/student/auth/check-email',
    verifyPath: '/student/auth/verify',
  },
  donor: {
    portal: 'donor',
    emailRule: 'DONOR',
    expectedRole: 'DONOR',
    kicker: 'Donor access',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Track your giving and manage how you are recognised.',
    registerTitle: 'Create your donor account',
    registerSubtitle: 'Create a donor account to give and follow your impact.',
    emailPlaceholder: 'you@example.org',
    loginPath: '/auth/login',
    registerPath: '/auth/register',
    checkEmailPath: '/auth/check-email',
    verifyPath: '/auth/verify',
  },
  staff: {
    portal: 'staff',
    emailRule: 'ADMIN',
    expectedRole: null,
    kicker: 'Staff access',
    loginTitle: 'Staff sign in',
    loginSubtitle: 'For administrators, the committee, finance, inventory, clerks and auditors.',
    registerTitle: '',
    registerSubtitle: '',
    emailPlaceholder: 'you@example.org',
    loginPath: '/staff/login',
    registerPath: null,
    checkEmailPath: '/staff/login',
    verifyPath: '/staff/login',
  },
});

export const STUDENT_LOGIN_PATH = PORTALS.student.loginPath;
export const DONOR_LOGIN_PATH = PORTALS.donor.loginPath;
export const STAFF_LOGIN_PATH = PORTALS.staff.loginPath;

/** Which login page protects a given app path: `/student/*` → student, `/donor/*` → donor, anything else → staff. */
export function loginPathForPath(pathname: string | undefined | null): string {
  const path = pathname ?? '';
  if (path === '/student' || path.startsWith('/student/')) return STUDENT_LOGIN_PATH;
  if (path === '/donor' || path.startsWith('/donor/')) return DONOR_LOGIN_PATH;
  return STAFF_LOGIN_PATH;
}

/** Login page matching a session's roles (used after sign-out). */
export function loginPathForRoles(roles: readonly string[] | undefined | null): string {
  const list = roles ?? [];
  const staff = list.some((role) => role !== 'STUDENT' && role !== 'DONOR');
  if (staff) return STAFF_LOGIN_PATH;
  if (list.includes('STUDENT')) return STUDENT_LOGIN_PATH;
  return DONOR_LOGIN_PATH;
}

/** Only follow in-app, non-auth return paths. */
export function safeReturnPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/auth/') || value === '/access-denied') {
    return undefined;
  }
  return value;
}

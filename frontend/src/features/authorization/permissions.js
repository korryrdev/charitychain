export const ROLE_HOME_PATHS = Object.freeze({ ADMIN: '/admin', COMMITTEE_MEMBER: '/committee', FINANCE_OFFICER: '/finance', CLERK: '/clerk', STUDENT: '/student', DONOR: '/donor' });
export function hasPermission(session, permission) { return Boolean(permission) && session?.permissions?.includes(permission); }
export function hasEveryPermission(session, permissions = []) { return permissions.every((permission) => hasPermission(session, permission)); }
export function hasAnyPermission(session, permissions = []) { return permissions.some((permission) => hasPermission(session, permission)); }
export function hasRole(session, roles = []) { return roles.some((role) => session?.roles?.includes(role)); }
export function defaultAuthorizedPath(session) { return session?.roles?.map((role) => ROLE_HOME_PATHS[role]).find(Boolean) ?? '/'; }

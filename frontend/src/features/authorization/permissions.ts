import type { PortalSession } from '@/types';

export const ROLE_HOME_PATHS: Record<string, string> = Object.freeze({
  ADMINISTRATOR: '/admin',
  AUDITOR: '/auditor',
  FINANCE_OPERATOR: '/finance',
  COMMITTEE_MEMBER: '/committee',
  INVENTORY_SUPERVISOR: '/inventory',
  CLERK: '/clerk',
  STUDENT: '/student',
  DONOR: '/donor',
});

export function hasPermission(session: PortalSession | null | undefined, permission: string): boolean {
  return Boolean(permission) && Boolean(session?.permissions?.includes(permission));
}

export function hasEveryPermission(session: PortalSession | null | undefined, permissions: string[] = []): boolean {
  return permissions.every((permission) => hasPermission(session, permission));
}

export function hasAnyPermission(session: PortalSession | null | undefined, permissions: string[] = []): boolean {
  return permissions.some((permission) => hasPermission(session, permission));
}

export function hasRole(session: PortalSession | null | undefined, roles: string[] = []): boolean {
  return roles.some((role) => Boolean(session?.roles?.includes(role)));
}

export function defaultAuthorizedPath(session: PortalSession | null | undefined): string {
  const priority = [
    'ADMINISTRATOR',
    'AUDITOR',
    'FINANCE_OPERATOR',
    'COMMITTEE_MEMBER',
    'INVENTORY_SUPERVISOR',
    'CLERK',
    'STUDENT',
    'DONOR',
  ];
  const roleHome = priority
    .map((role) => (session?.roles?.includes(role) ? ROLE_HOME_PATHS[role] : null))
    .find(Boolean);
  if (roleHome) return roleHome;

  const permissions = session?.permissions ?? [];
  if (permissions.includes('system:administer')) return '/admin';
  if (
    permissions.some((value) =>
      ['forensics:read', 'forensics:investigate', 'audit:read', 'evidence:read', 'report:read', 'report:generate'].includes(value)
    )
  ) {
    return '/auditor';
  }
  if (
    permissions.some((value) =>
      ['disbursement:create', 'disbursement:execute', 'disbursement:read', 'reconciliation:execute', 'reconciliation:read'].includes(value)
    )
  ) {
    return '/finance';
  }
  if (
    permissions.some((value) => ['application:review', 'application:approve', 'committee:manage'].includes(value))
  ) {
    return '/committee';
  }
  if (
    permissions.some((value) =>
      [
        'inventory:read',
        'inventory:manage',
        'physical-donation:record',
        'physical-donation:inspect',
        'goods-collection:record',
        'goods-collection:release',
      ].includes(value)
    )
  ) {
    return '/clerk';
  }
  return '/';
}

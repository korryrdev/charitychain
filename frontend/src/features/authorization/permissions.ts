import type { PortalSession } from '@/types';

export const ROLE_HOME_PATHS: Record<string, string> = Object.freeze({
  ADMINISTRATOR: '/admin',
  SYSTEM_ADMIN: '/admin',
  AUDITOR: '/auditor',
  MEMBER_AUDITOR: '/auditor',
  FINANCE_OPERATOR: '/finance',
  TREASURER: '/finance',
  SIGNATORY: '/committee/signing',
  COMMITTEE_MEMBER: '/committee',
  SUBGROUP_REP: '/committee/cases',
  INVENTORY_SUPERVISOR: '/inventory',
  PHARMACY_CUSTODIAN: '/inventory/pharmacy',
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
    'SYSTEM_ADMIN',
    'AUDITOR',
    'MEMBER_AUDITOR',
    'FINANCE_OPERATOR',
    'TREASURER',
    'SIGNATORY',
    'COMMITTEE_MEMBER',
    'SUBGROUP_REP',
    'INVENTORY_SUPERVISOR',
    'PHARMACY_CUSTODIAN',
    'CLERK',
    'STUDENT',
    'DONOR',
  ];
  const roleHome = priority
    .map((role) => (session?.roles?.includes(role) ? ROLE_HOME_PATHS[role] : null))
    .find(Boolean);
  if (roleHome) return roleHome;

  const permissions = session?.permissions ?? [];
  if (permissions.some((value) => ['system:administer', 'user:manage', 'role:manage', 'policy:manage'].includes(value))) {
    return '/admin';
  }
  if (
    permissions.some((value) =>
      [
        'disbursement:create',
        'disbursement:execute',
        'disbursement:read',
        'reconciliation:execute',
        'reconciliation:read',
        'bank-deposit:create',
        'bank-deposit:verify',
      ].includes(value)
    )
  ) {
    return '/finance';
  }
  if (permissions.includes('release:authorize')) return '/committee/signing';
  if (
    permissions.some((value) =>
      ['application:review', 'application:approve', 'committee:manage', 'case:decide'].includes(value)
    )
  ) {
    return '/committee';
  }
  if (permissions.some((value) => ['case:create', 'case:submit', 'case:update:draft', 'case:read'].includes(value))) {
    return '/committee/cases';
  }
  if (permissions.some((value) => ['item-log:create', 'item:issue'].includes(value))) {
    return '/inventory/pharmacy';
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
  if (
    permissions.some((value) =>
      [
        'forensics:read',
        'forensics:investigate',
        'audit:read',
        'evidence:read',
        'report:read',
        'report:generate',
        'alert:read',
        'rules:manage',
      ].includes(value)
    )
  ) {
    return '/auditor';
  }
  if (permissions.some((value) => ['application:create', 'application:read:self', 'student-record:read:self'].includes(value))) {
    return '/student';
  }
  if (permissions.some((value) => ['donation:create', 'donation:read:self'].includes(value))) {
    return '/donor';
  }
  return '/';
}

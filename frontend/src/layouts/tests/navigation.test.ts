import { describe, expect, it } from 'vitest';
import { NAVIGATION, allowedNavigation } from '../navigation';
describe('portal navigation', () => {
  it('only exposes routes allowed by server-issued role and permissions', () => {
    const clerk = { roles: ['CLERK'], permissions: ['physical-donation:record', 'inventory:read'] };
    expect(allowedNavigation(NAVIGATION.operations, clerk).map((item) => item.to)).toEqual([
      '/clerk',
      '/clerk/receive',
      '/clerk/inventory',
      '/clerk/rejected',
      '/inventory',
      '/inventory/stock',
    ]);
    expect(allowedNavigation(NAVIGATION.governance, clerk)).toEqual([]);
  });

  it('exposes administration navigation to SYSTEM_ADMIN and ADMINISTRATOR permissions', () => {
    const sysAdmin = {
      roles: ['SYSTEM_ADMIN'],
      permissions: ['system:administer', 'user:manage', 'role:manage', 'policy:manage'],
    };
    expect(allowedNavigation(NAVIGATION.administration, sysAdmin).length).toBe(8);
    expect(allowedNavigation(NAVIGATION.governance, sysAdmin).some((item) => item.to === '/admin')).toBe(true);
  });
});

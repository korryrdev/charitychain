import { describe, expect, it } from 'vitest';
import { defaultAuthorizedPath, hasAnyPermission, hasEveryPermission, hasRole } from '../permissions';
describe('authorization rules', () => {
  const session = { roles: ['CLERK'], permissions: ['inventory:read', 'goods-collection:record'] };
  it('uses server-issued permissions and roles only', () => {
    expect(hasEveryPermission(session, ['inventory:read', 'goods-collection:record'])).toBe(true);
    expect(hasAnyPermission(session, ['system:administer', 'inventory:read'])).toBe(true);
    expect(hasRole(session, ['ADMINISTRATOR', 'CLERK'])).toBe(true);
    expect(defaultAuthorizedPath(session)).toBe('/clerk');
  });
  it.each([
    ['ADMINISTRATOR', '/admin'], ['AUDITOR', '/auditor'], ['FINANCE_OPERATOR', '/finance'],
    ['COMMITTEE_MEMBER', '/committee'], ['INVENTORY_SUPERVISOR', '/inventory']
  ])('sends %s to its protected portal', (role, path) => {
    expect(defaultAuthorizedPath({ roles: [role] })).toBe(path);
  });
  it('prioritizes administration for a multi-role staff account', () => {
    expect(defaultAuthorizedPath({ roles: ['DONOR', 'ADMINISTRATOR'] })).toBe('/admin');
  });
});

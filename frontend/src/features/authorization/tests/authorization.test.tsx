import { describe, expect, it } from 'vitest';
import { ALL_PERMISSIONS } from '../../administration/permissionCatalog';
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
    ['ADMINISTRATOR', '/admin'],
    ['SYSTEM_ADMIN', '/admin'],
    ['AUDITOR', '/auditor'],
    ['MEMBER_AUDITOR', '/auditor'],
    ['FINANCE_OPERATOR', '/finance'],
    ['TREASURER', '/finance'],
    ['SIGNATORY', '/committee/signing'],
    ['COMMITTEE_MEMBER', '/committee'],
    ['SUBGROUP_REP', '/committee/cases'],
    ['INVENTORY_SUPERVISOR', '/inventory'],
    ['PHARMACY_CUSTODIAN', '/inventory/pharmacy'],
    ['CLERK', '/clerk'],
    ['STUDENT', '/student'],
    ['DONOR', '/donor'],
  ])('sends %s to its protected portal', (role, path) => {
    expect(defaultAuthorizedPath({ roles: [role] })).toBe(path);
  });
  it('prioritizes finance/signatory permissions before auditor read permissions', () => {
    expect(
      defaultAuthorizedPath({
        permissions: ['forensics:read', 'report:read', 'bank-deposit:verify'],
      })
    ).toBe('/finance');
    expect(
      defaultAuthorizedPath({
        permissions: ['forensics:read', 'report:read', 'release:authorize'],
      })
    ).toBe('/committee/signing');
  });
  it('prioritizes administration for a multi-role staff account', () => {
    expect(defaultAuthorizedPath({ roles: ['DONOR', 'ADMINISTRATOR'] })).toBe('/admin');
  });
  it('catalogs all 55 backend permissions', () => {
    expect(ALL_PERMISSIONS).toHaveLength(55);
  });
});

import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database seeds', () => {
  it('provisions core roles, PRD governance roles, recognition tiers, and admin-only user', async () => {
    const roles = await prisma.role.findMany({ select: { code: true } });
    const roleCodes = roles.map((r) => r.code);

    for (const required of [
      'DONOR',
      'STUDENT',
      'CLERK',
      'INVENTORY_SUPERVISOR',
      'COMMITTEE_MEMBER',
      'FINANCE_OPERATOR',
      'AUDITOR',
      'ADMINISTRATOR',
      'PHARMACY_CUSTODIAN',
      'TREASURER',
      'SIGNATORY',
      'SUBGROUP_REP',
      'MEMBER_AUDITOR',
      'SYSTEM_ADMIN'
    ]) {
      expect(roleCodes).toContain(required);
    }

    expect(await prisma.permission.count()).toBeGreaterThanOrEqual(50);
    expect(await prisma.recognitionTier.count()).toBeGreaterThanOrEqual(4);

    const adminEmail = (process.env.ADMIN_EMAIL || 'kotlin.hustlehub@gmail.com').trim().toLowerCase();
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: { roles: { include: { role: true } } }
    });
    expect(admin).not.toBeNull();
    expect(admin.roles.some((r) => r.role.code === 'ADMINISTRATOR')).toBe(true);

    const legacyUsersCount = await prisma.user.count({
      where: {
        email: {
          in: [
            'admin@charitychain.org',
            'pharmacy@malkia.charity',
            'committee@malkia.charity',
            'chair@malkia.charity',
            'signatory1@malkia.charity',
            'treasurer@malkia.charity',
            'demo.inventory.clerk@charitychain.test'
          ]
        }
      }
    });
    expect(legacyUsersCount).toBe(0);
  });
});

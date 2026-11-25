import { describe, expect, it } from 'vitest';
import { prisma } from '../client/prismaClient.js';

describe('database seeds', () => {
  it('provisions core roles, PRD governance roles, recognition tiers, and simulated university students', async () => {
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
    expect(await prisma.student.count()).toBeGreaterThanOrEqual(30);
  });
});

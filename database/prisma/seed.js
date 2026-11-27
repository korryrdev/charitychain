import { prisma } from '../client/prismaClient.js';
import { seedAdmin } from './seedAdmin.js';

const roles = [
  ['DONOR', 'Donor'],
  ['STUDENT', 'Student'],
  ['CLERK', 'Clerk'],
  ['INVENTORY_SUPERVISOR', 'Inventory Supervisor'],
  ['COMMITTEE_MEMBER', 'Committee Member'],
  ['FINANCE_OPERATOR', 'Finance Operator'],
  ['AUDITOR', 'Auditor'],
  ['ADMINISTRATOR', 'Administrator'],
  ['PHARMACY_CUSTODIAN', 'Pharmacy Custodian'],
  ['TREASURER', 'Treasurer'],
  ['SIGNATORY', 'Signatory'],
  ['SUBGROUP_REP', 'Subgroup Representative'],
  ['MEMBER_AUDITOR', 'Member Auditor'],
  ['SYSTEM_ADMIN', 'System Administrator']
];

const permissions = [
  'profile:read:self',
  'profile:update:self',
  'donation:create',
  'donation:read:self',
  'donation:read:all',
  'physical-donation:record',
  'physical-donation:inspect',
  'confirmation:manage',
  'inventory:read',
  'inventory:manage',
  'goods-collection:record',
  'goods-collection:release',
  'student-record:read:self',
  'student-record:read:all',
  'student-record:manage',
  'application:create',
  'application:read:self',
  'application:review',
  'vetting:execute',
  'vetting-policy:manage',
  'application:approve',
  'committee:manage',
  'disbursement:create',
  'disbursement:execute',
  'disbursement:read',
  'reconciliation:execute',
  'reconciliation:read',
  'evidence:read',
  'audit:read',
  'forensics:read',
  'forensics:investigate',
  'report:read',
  'report:generate',
  'complaint:create',
  'complaint:manage',
  'policy:manage',
  'role:manage',
  'user:manage',
  'system:administer',
  'case:create',
  'case:read',
  'case:update:draft',
  'case:submit',
  'case:decide',
  'release:authorize',
  'bank-deposit:create',
  'bank-deposit:verify',
  'item-log:create',
  'item:issue',
  'alert:read',
  'alert:resolve',
  'rules:manage',
  'donor-identity:reveal',
  'recognition:moderate',
  'badge-tier:manage'
];

const rolePermissions = {
  DONOR: [
    'profile:read:self',
    'profile:update:self',
    'donation:create',
    'donation:read:self',
    'complaint:create'
  ],
  STUDENT: [
    'profile:read:self',
    'profile:update:self',
    'student-record:read:self',
    'application:create',
    'application:read:self',
    'complaint:create'
  ],
  CLERK: [
    'profile:read:self',
    'item-log:create',
    'item:issue',
    'physical-donation:record',
    'confirmation:manage',
    'inventory:read',
    'goods-collection:record',
    'goods-collection:release',
    'student-record:read:all'
  ],
  PHARMACY_CUSTODIAN: [
    'item-log:create',
    'item:issue',
    'inventory:read',
    'inventory:manage',
    'physical-donation:record',
    'goods-collection:record',
    'goods-collection:release'
  ],
  INVENTORY_SUPERVISOR: [
    'item-log:create',
    'item:issue',
    'inventory:read',
    'inventory:manage',
    'physical-donation:inspect',
    'report:read'
  ],
  COMMITTEE_MEMBER: [
    'case:read',
    'case:decide',
    'application:review',
    'application:approve',
    'vetting:execute',
    'evidence:read',
    'report:read',
    'bank-deposit:create',
    'bank-deposit:verify',
    'alert:read',
    'forensics:read'
  ],
  TREASURER: [
    'bank-deposit:create',
    'bank-deposit:verify',
    'donation:read:all',
    'disbursement:create',
    'disbursement:execute',
    'reconciliation:execute',
    'reconciliation:read',
    'report:read',
    'alert:read',
    'forensics:read'
  ],
  SIGNATORY: [
    'release:authorize',
    'case:read',
    'disbursement:read',
    'report:read',
    'alert:read',
    'forensics:read'
  ],
  SUBGROUP_REP: [
    'case:create',
    'case:read',
    'case:update:draft',
    'case:submit'
  ],
  FINANCE_OPERATOR: [
    'donation:read:all',
    'disbursement:create',
    'disbursement:execute',
    'disbursement:read',
    'reconciliation:execute',
    'reconciliation:read',
    'report:read'
  ],
  AUDITOR: [
    'donation:read:all',
    'inventory:read',
    'disbursement:read',
    'reconciliation:read',
    'evidence:read',
    'audit:read',
    'alert:read',
    'alert:resolve',
    'forensics:read',
    'forensics:investigate',
    'report:read'
  ],
  MEMBER_AUDITOR: [
    'donation:read:all',
    'audit:read',
    'alert:read',
    'alert:resolve',
    'forensics:read',
    'forensics:investigate',
    'report:read'
  ],
  ADMINISTRATOR: permissions,
  SYSTEM_ADMIN: permissions
};

const recognitionTiers = [
  { code: 'SILVER', name: 'Silver', rank: 1, minimumValue: '1.00' },
  { code: 'GOLD', name: 'Gold', rank: 2, minimumValue: '25000.00' },
  { code: 'DIAMOND', name: 'Diamond', rank: 3, minimumValue: '100000.00' },
  { code: 'PLATINUM', name: 'Platinum', rank: 4, minimumValue: '500000.00' }
];

await prisma.$transaction(
  async (transaction) => {
    for (const [code, name] of roles) {
      await transaction.role.upsert({
        where: { code },
        update: { name },
        create: { code, name }
      });
    }

    for (const code of permissions) {
      await transaction.permission.upsert({
        where: { code },
        update: {},
        create: { code }
      });
    }

    for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
      const role = await transaction.role.findUniqueOrThrow({ where: { code: roleCode } });
      const selectedPermissions = await transaction.permission.findMany({
        where: { code: { in: permissionCodes } }
      });
      await transaction.rolePermission.deleteMany({ where: { roleId: role.id } });
      await transaction.rolePermission.createMany({
        data: selectedPermissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id
        }))
      });
    }

    for (const tier of recognitionTiers) {
      await transaction.recognitionTier.upsert({
        where: { code: tier.code },
        update: tier,
        create: tier
      });
    }

    const activeSemester = await transaction.academicSemester.findFirst({
      where: { active: true }
    });
    if (!activeSemester) {
      await transaction.academicSemester.upsert({
        where: { code: '2026-2027-S1' },
        update: { active: true },
        create: {
          code: '2026-2027-S1',
          name: 'Semester 1',
          academicYear: '2026/2027',
          startsAt: new Date('2026-09-01T00:00:00.000Z'),
          endsAt: new Date('2026-12-18T23:59:59.000Z'),
          feeDueAt: new Date('2026-09-18T23:59:59.000Z'),
          active: true
        }
      });
    }

    // Remove legacy deterministic demo tokens
    await transaction.session.deleteMany({
      where: { token: { startsWith: 'malkia-token-' } }
    });
  },
  { timeout: 30_000 }
);

await seedAdmin();
await prisma.$disconnect();

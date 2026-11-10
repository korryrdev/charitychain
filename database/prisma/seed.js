import { prisma } from '../client/prismaClient.js';

const roles = [
  ['DONOR', 'Donor'],
  ['STUDENT', 'Student'],
  ['CLERK', 'Clerk'],
  ['INVENTORY_SUPERVISOR', 'Inventory Supervisor'],
  ['COMMITTEE_MEMBER', 'Committee Member'],
  ['FINANCE_OPERATOR', 'Finance Operator'],
  ['AUDITOR', 'Auditor'],
  ['ADMINISTRATOR', 'Administrator']
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
  'system:administer'
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
    'physical-donation:record',
    'confirmation:manage',
    'inventory:read',
    'goods-collection:record',
    'goods-collection:release',
    'student-record:read:all'
  ],
  INVENTORY_SUPERVISOR: [
    'inventory:read',
    'inventory:manage',
    'physical-donation:inspect',
    'report:read'
  ],
  COMMITTEE_MEMBER: [
    'application:review',
    'application:approve',
    'vetting:execute',
    'evidence:read',
    'report:read'
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
    'forensics:read',
    'forensics:investigate',
    'report:read'
  ],
  ADMINISTRATOR: permissions
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
  },
  { timeout: 30_000 }
);

await prisma.$disconnect();

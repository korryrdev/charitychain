import { prisma } from '@charitychain/database';

export function createRolesRepository(database = prisma) {
  return {
    list() {
      return database.role.findMany({
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } }
        },
        orderBy: { code: 'asc' }
      });
    },
    countAssignments(roleCode) {
      return database.userRole.count({ where: { role: { code: roleCode } } });
    },
    assign(userId, roleCode) {
      return database.$transaction(async (transaction) => {
        const role = await transaction.role.findUniqueOrThrow({ where: { code: roleCode } });
        return transaction.userRole.upsert({
          where: { userId_roleId: { userId, roleId: role.id } },
          update: {},
          create: { userId, roleId: role.id }
        });
      });
    },
    remove(userId, roleCode) {
      return database.$transaction(async (transaction) => {
        const role = await transaction.role.findUniqueOrThrow({ where: { code: roleCode } });
        return transaction.userRole.delete({
          where: { userId_roleId: { userId, roleId: role.id } }
        });
      });
    },
    setPermissions(roleCode, permissionCodes) {
      return database.$transaction(async (transaction) => {
        const role = await transaction.role.findUniqueOrThrow({ where: { code: roleCode } });
        const permissions = await transaction.permission.findMany({
          where: { code: { in: permissionCodes } }
        });
        await transaction.rolePermission.deleteMany({ where: { roleId: role.id } });
        await transaction.rolePermission.createMany({
          data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id }))
        });
        return { role, permissions };
      });
    }
  };
}

export const rolesRepository = createRolesRepository();

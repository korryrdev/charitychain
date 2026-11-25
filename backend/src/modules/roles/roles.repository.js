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
    create({ code, name, description, permissionCodes }) {
      return database.$transaction(async (transaction) => {
        const permissions = await transaction.permission.findMany({ where: { code: { in: permissionCodes } } });
        if (permissions.length !== permissionCodes.length) throw new Error('PERMISSION_NOT_FOUND');
        return transaction.role.create({
          data: {
            code,
            name,
            description: description ?? null,
            permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) }
          },
          include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } }
        });
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
    replaceAssignments(userId, roleCodes) {
      return database.$transaction(async (transaction) => {
        const roles = await transaction.role.findMany({ where: { code: { in: roleCodes } } });
        if (roles.length !== roleCodes.length) throw new Error('ROLE_NOT_FOUND');
        const roleIds = roles.map((role) => role.id);
        await transaction.userRole.deleteMany({ where: { userId, ...(roleIds.length ? { roleId: { notIn: roleIds } } : {}) } });
        if (roleIds.length) await transaction.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })), skipDuplicates: true });
        return transaction.user.findUniqueOrThrow({
          where: { id: userId },
          include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
        });
      });
    },
    replaceUserPermissionAccess(userId, permissionCodes) {
      return database.$transaction(async (transaction) => {
        const permissions = await transaction.permission.findMany({ where: { code: { in: permissionCodes } } });
        if (permissions.length !== permissionCodes.length) throw new Error('PERMISSION_NOT_FOUND');
        const user = await transaction.user.findUniqueOrThrow({ where: { id: userId } });
        const code = `CUSTOM_USER_${userId.replaceAll('-', '').slice(0, 24).toUpperCase()}`;
        let role = await transaction.role.findUnique({ where: { code } });
        if (!role) role = await transaction.role.create({ data: { code, name: `Custom access: ${user.name}`.slice(0, 100), description: 'User-specific permission assignment' } });
        await transaction.rolePermission.deleteMany({ where: { roleId: role.id } });
        await transaction.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })) });
        await transaction.userRole.deleteMany({ where: { userId } });
        await transaction.userRole.create({ data: { userId, roleId: role.id } });
        return transaction.user.findUniqueOrThrow({ where: { id: userId }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
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
    },
    deleteIfUnused(roleCode) {
      return database.role.deleteMany({ where: { code: roleCode, users: { none: {} } } });
    }
  };
}

export const rolesRepository = createRolesRepository();

import { prisma } from '@charitychain/database';

const includeRoles = { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } };

export function createUsersRepository(database = prisma) {
  return {
    findById(id) {
      return database.user.findUnique({ where: { id }, include: includeRoles });
    },
    async list({ page, pageSize, status, search }) {
      const where = {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      };
      const [items, total] = await database.$transaction([
        database.user.findMany({
          where,
          include: includeRoles,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        database.user.count({ where })
      ]);
      return { items, total, page, pageSize };
    },
    updateProfile(id, data) {
      return database.user.update({ where: { id }, data, include: includeRoles });
    },
    updateStatus(id, status) {
      return database.$transaction(async (transaction) => {
        const user = await transaction.user.update({
          where: { id },
          data: { status },
          include: includeRoles
        });
        if (status !== 'ACTIVE') await transaction.session.deleteMany({ where: { userId: id } });
        return user;
      });
    },
    async assignRoles(id, roleCodes) {
      return database.$transaction(async (transaction) => {
        const roles = await transaction.role.findMany({ where: { code: { in: roleCodes } } });
        if (roles.length !== roleCodes.length) throw new Error('ROLE_NOT_FOUND');
        await transaction.userRole.createMany({
          data: roles.map((role) => ({ userId: id, roleId: role.id })),
          skipDuplicates: true
        });
        return transaction.user.findUniqueOrThrow({ where: { id }, include: includeRoles });
      });
    },
    closeDonorAccount(id) {
      return database.$transaction(async (transaction) => {
        await transaction.donorProfile.updateMany({
          where: { userId: id },
          data: {
            publicListed: false,
            showContributionTotal: false,
            showRecognitionTier: false
          }
        });
        await transaction.session.deleteMany({ where: { userId: id } });
        return transaction.user.update({
          where: { id },
          data: { status: 'DISABLED' },
          include: includeRoles
        });
      });
    }
  };
}

export const usersRepository = createUsersRepository();

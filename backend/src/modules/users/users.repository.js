import { prisma } from '@charitychain/database';

const includeRoles = { roles: { include: { role: true } } };

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
    }
  };
}

export const usersRepository = createUsersRepository();

import { prisma } from '@charitychain/database';

export function createSessionsRepository(database = prisma) {
  return {
    listByUser(userId) {
      return database.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
    },
    findById(id) {
      return database.session.findUnique({ where: { id } });
    },
    revoke(id) {
      return database.session.delete({ where: { id } });
    },
    revokeAll(userId, exceptId) {
      return database.session.deleteMany({
        where: { userId, ...(exceptId ? { id: { not: exceptId } } : {}) }
      });
    },
    rotate(id, token, expiresAt) {
      return database.session.update({ where: { id }, data: { token, expiresAt } });
    }
  };
}

export const sessionsRepository = createSessionsRepository();

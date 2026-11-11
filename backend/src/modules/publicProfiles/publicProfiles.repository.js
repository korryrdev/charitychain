import { prisma } from '@charitychain/database';
import { publicVisibilityFilter } from './publicProfiles.policy.js';

export function createPublicProfilesRepository(database = prisma) {
  return {
    findPublicById(id) {
      return database.donorProfile.findFirst({
        where: { id, ...publicVisibilityFilter() },
        include: { user: { select: { name: true } } }
      });
    },
    findByUserId(userId) {
      return database.donorProfile.findUnique({ where: { userId } });
    },
    updateSettings(id, settings) {
      return database.donorProfile.update({ where: { id }, data: settings });
    },
    async list({ page, pageSize, tier }) {
      const where = { ...publicVisibilityFilter(), ...(tier ? { recognitionTier: tier } : {}) };
      const [items, total] = await database.$transaction([
        database.donorProfile.findMany({
          where,
          include: { user: { select: { name: true } } },
          orderBy: [{ totalContribution: 'desc' }, { createdAt: 'asc' }],
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        database.donorProfile.count({ where })
      ]);
      return { items, total, page, pageSize };
    }
  };
}

export const publicProfilesRepository = createPublicProfilesRepository();

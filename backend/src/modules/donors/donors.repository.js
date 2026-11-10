import { prisma } from '@charitychain/database';

export function createDonorsRepository(database = prisma) {
  return {
    aliasExists(normalizedAlias) {
      return database.donorProfile
        .count({
          where: { OR: [{ normalizedAlias }, { pendingNormalizedAlias: normalizedAlias }] }
        })
        .then(Boolean);
    },
    create(userId, publicAlias, normalizedAlias) {
      return database.donorProfile.create({ data: { userId, publicAlias, normalizedAlias } });
    },
    findByUserId(userId) {
      return database.donorProfile.findUnique({ where: { userId } });
    },
    findById(id) {
      return database.donorProfile.findUnique({ where: { id } });
    },
    submitAlias(id, pendingAlias, pendingNormalizedAlias) {
      return database.donorProfile.update({
        where: { id },
        data: { pendingAlias, pendingNormalizedAlias, aliasReviewStatus: 'PENDING_REVIEW' }
      });
    },
    decideAlias(id, approved) {
      return database.$transaction(async (transaction) => {
        const profile = await transaction.donorProfile.findUniqueOrThrow({ where: { id } });
        return transaction.donorProfile.update({
          where: { id },
          data: approved
            ? {
                publicAlias: profile.pendingAlias,
                normalizedAlias: profile.pendingNormalizedAlias,
                pendingAlias: null,
                pendingNormalizedAlias: null,
                aliasReviewStatus: 'APPROVED'
              }
            : {
                pendingAlias: null,
                pendingNormalizedAlias: null,
                aliasReviewStatus: 'REJECTED'
              }
        });
      });
    }
  };
}

export const donorsRepository = createDonorsRepository();

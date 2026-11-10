import { prisma } from '@charitychain/database';
import { Prisma } from '@prisma/client';
import { calculateTier } from './tierCalculator.service.js';

export function createRecognitionRepository(database = prisma) {
  return {
    listTiers() {
      return database.recognitionTier.findMany({
        where: { active: true },
        orderBy: { rank: 'asc' }
      });
    },
    findByUserId(userId) {
      return database.donorProfile.findUnique({ where: { userId } });
    },
    async history(donorProfileId, { page, pageSize }) {
      const where = { donorProfileId };
      const [items, total] = await database.$transaction([
        database.recognitionHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        database.recognitionHistory.count({ where })
      ]);
      return { items, total, page, pageSize };
    },
    async record(donorProfileId, sourceType, sourceId, value) {
      return database.$transaction(async (transaction) => {
        await transaction.recognizedContribution.create({
          data: { donorProfileId, sourceType, sourceId, value }
        });
        const grouped = await transaction.recognizedContribution.groupBy({
          by: ['sourceType'],
          where: { donorProfileId },
          _sum: { value: true }
        });
        const money =
          grouped.find((item) => item.sourceType === 'MONEY')?._sum.value ?? new Prisma.Decimal(0);
        const goods =
          grouped.find((item) => item.sourceType === 'GOODS')?._sum.value ?? new Prisma.Decimal(0);
        const total = new Prisma.Decimal(money).plus(goods);
        const tiers = await transaction.recognitionTier.findMany({ where: { active: true } });
        const nextTier = calculateTier(total, tiers);
        const current = await transaction.donorProfile.findUniqueOrThrow({
          where: { id: donorProfileId }
        });
        const profile = await transaction.donorProfile.update({
          where: { id: donorProfileId },
          data: {
            moneyContribution: money,
            goodsContribution: goods,
            totalContribution: total,
            recognitionTier: nextTier
          }
        });
        if (current.recognitionTier !== nextTier) {
          await transaction.recognitionHistory.create({
            data: {
              donorProfileId,
              fromTier: current.recognitionTier,
              toTier: nextTier,
              totalValue: total,
              reason: 'VERIFIED_CONTRIBUTION'
            }
          });
        }
        return profile;
      });
    },
    async remove(donorProfileId, sourceType, sourceId) {
      return database.$transaction(async (transaction) => {
        await transaction.recognizedContribution.deleteMany({
          where: { donorProfileId, sourceType, sourceId }
        });
        const grouped = await transaction.recognizedContribution.groupBy({
          by: ['sourceType'],
          where: { donorProfileId },
          _sum: { value: true }
        });
        const money =
          grouped.find((item) => item.sourceType === 'MONEY')?._sum.value ??
          new Prisma.Decimal(0);
        const goods =
          grouped.find((item) => item.sourceType === 'GOODS')?._sum.value ??
          new Prisma.Decimal(0);
        const total = new Prisma.Decimal(money).plus(goods);
        const tiers = await transaction.recognitionTier.findMany({ where: { active: true } });
        const nextTier = calculateTier(total, tiers);
        const current = await transaction.donorProfile.findUniqueOrThrow({
          where: { id: donorProfileId }
        });
        const profile = await transaction.donorProfile.update({
          where: { id: donorProfileId },
          data: {
            moneyContribution: money,
            goodsContribution: goods,
            totalContribution: total,
            recognitionTier: nextTier
          }
        });
        if (current.recognitionTier !== nextTier) {
          await transaction.recognitionHistory.create({
            data: {
              donorProfileId,
              fromTier: current.recognitionTier,
              toTier: nextTier,
              totalValue: total,
              reason: 'CONTRIBUTION_REVERSED'
            }
          });
        }
        return profile;
      });
    }
  };
}

export const recognitionRepository = createRecognitionRepository();

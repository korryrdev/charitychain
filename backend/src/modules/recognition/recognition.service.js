import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { Prisma } from '@prisma/client';
import { calculateGoodsValue } from './goodsValuation.service.js';
import { recognitionRepository } from './recognition.repository.js';

function requireProfile(profile) {
  if (!profile)
    throw new AppError({
      message: 'Donor profile not found.',
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      statusCode: 404
    });
  return profile;
}

export function createRecognitionService(repository = recognitionRepository) {
  async function record(userId, sourceType, sourceId, value) {
    const contributionValue = new Prisma.Decimal(value);
    if (!contributionValue.isPositive()) {
      throw new ValidationError('Recognition value must be greater than zero.');
    }
    const profile = requireProfile(await repository.findByUserId(userId));
    try {
      return await repository.record(profile.id, sourceType, sourceId, contributionValue);
    } catch (error) {
      if (error.code === 'P2002') return repository.findByUserId(userId);
      throw error;
    }
  }

  return {
    listTiers: () => repository.listTiers(),
    async mine(auth) {
      const profile = requireProfile(await repository.findByUserId(auth.user.id));
      const tiers = await repository.listTiers();
      const nextTier = tiers.find((tier) =>
        tier.minimumValue.greaterThan(profile.totalContribution)
      );
      return {
        moneyContribution: profile.moneyContribution.toString(),
        goodsContribution: profile.goodsContribution.toString(),
        totalContribution: profile.totalContribution.toString(),
        recognitionTier: profile.recognitionTier,
        nextTier: nextTier
          ? {
              code: nextTier.code,
              remainingValue: nextTier.minimumValue.minus(profile.totalContribution).toString()
            }
          : null
      };
    },
    async history(auth, query) {
      const profile = requireProfile(await repository.findByUserId(auth.user.id));
      return repository.history(profile.id, query);
    },
    async recordMoney(userId, sourceId, amount) {
      return record(userId, 'MONEY', sourceId, amount);
    },
    async recordGoods(userId, sourceId, valuationLines) {
      return record(userId, 'GOODS', sourceId, calculateGoodsValue(valuationLines));
    },
    async removeMoney(userId, sourceId) {
      const profile = requireProfile(await repository.findByUserId(userId));
      return repository.remove(profile.id, 'MONEY', sourceId);
    }
  };
}

export const recognitionService = createRecognitionService();

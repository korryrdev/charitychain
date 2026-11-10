'use strict';

import { prisma } from '@charitychain/database';
import { logger } from '../../observability/logger.js';

export const DEFAULT_BADGE_THRESHOLDS = Object.freeze({
  BRONZE: 100_000n,
  SILVER: 1_000_000n,
  GOLD: 5_000_000n,
  PATRON: 25_000_000n
});

export function createBadgesService({ database = prisma } = {}) {
  return {
    async getActiveThresholds() {
      const stored = await database.forensicRuleConfig.findUnique({
        where: { id: 'BADGE_THRESHOLDS' }
      });
      if (stored?.thresholdParams) {
        return {
          BRONZE: BigInt(stored.thresholdParams.BRONZE || 100000),
          SILVER: BigInt(stored.thresholdParams.SILVER || 1000000),
          GOLD: BigInt(stored.thresholdParams.GOLD || 5000000),
          PATRON: BigInt(stored.thresholdParams.PATRON || 25000000)
        };
      }
      return DEFAULT_BADGE_THRESHOLDS;
    },

    async proposeTierChange({ tier, thresholdMinor, proposedByUserId }) {
      const coolingDays = 7;
      const activatesAt = new Date(Date.now() + coolingDays * 86400000);

      const rule = await database.forensicRuleConfig.upsert({
        where: { id: `PROPOSAL_TIER_${tier}` },
        update: {
          thresholdParams: {
            tier,
            thresholdMinor: thresholdMinor.toString(),
            proposedByUserId,
            activatesAt: activatesAt.toISOString(),
            status: 'PENDING_APPROVAL'
          }
        },
        create: {
          id: `PROPOSAL_TIER_${tier}`,
          name: `Tier ${tier} Threshold Proposal`,
          description: `Proposed threshold change for ${tier} with 7-day cooling period`,
          severity: 'LOW',
          phase: 2,
          thresholdParams: {
            tier,
            thresholdMinor: thresholdMinor.toString(),
            proposedByUserId,
            activatesAt: activatesAt.toISOString(),
            status: 'PENDING_APPROVAL'
          }
        }
      });

      return { tier, thresholdMinor: thresholdMinor.toString(), coolingDays, activatesAt };
    },

    async recomputeDonorBadges(donorRef, academicYear = '2025/2026') {
      const lots = await database.donationLot.findMany({
        where: { donorRef, currency: 'KES' }
      });

      const totalMinor = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
      const thresholds = await this.getActiveThresholds();

      const qualifiedTiers = [];
      if (totalMinor >= thresholds.PATRON) qualifiedTiers.push('PATRON');
      if (totalMinor >= thresholds.GOLD) qualifiedTiers.push('GOLD');
      if (totalMinor >= thresholds.SILVER) qualifiedTiers.push('SILVER');
      if (totalMinor >= thresholds.BRONZE) qualifiedTiers.push('BRONZE');

      const distinctMonths = new Set(
        lots.map((l) => `${l.createdAt.getUTCFullYear()}-${l.createdAt.getUTCMonth()}`)
      );
      if (distinctMonths.size >= 3) {
        qualifiedTiers.push('CONSISTENT');
      }

      const existingAwards = await database.donorBadgeAward.findMany({
        where: { donorRef, academicYear, isRevoked: false }
      });
      const existingTiers = new Set(existingAwards.map((a) => a.tier));

      const newAwards = [];
      for (const tier of qualifiedTiers) {
        if (!existingTiers.has(tier)) {
          const award = await database.donorBadgeAward.create({
            data: {
              donorRef,
              tier,
              academicYear
            }
          });
          newAwards.push(award);

          await database.outboxEvent.create({
            data: {
              eventName: 'badge.awarded',
              aggregateType: 'DonorBadge',
              aggregateId: award.id,
              idempotencyKey: `badge:${donorRef}:${tier}:${academicYear}`,
              payload: {
                donorRef,
                tier,
                academicYear,
                totalMinor: totalMinor.toString()
              }
            }
          });
        }
      }

      return {
        donorRef,
        totalMinor: totalMinor.toString(),
        qualifiedTiers,
        newAwardsCount: newAwards.length
      };
    },

    async recomputeAll(academicYear = '2025/2026') {
      const donors = await database.donationLot.findMany({
        distinct: ['donorRef'],
        select: { donorRef: true }
      });

      let totalNewAwards = 0;
      for (const { donorRef } of donors) {
        const result = await this.recomputeDonorBadges(donorRef, academicYear);
        totalNewAwards += result.newAwardsCount;
      }

      logger.info({ donorsProcessed: donors.length, totalNewAwards }, 'Nightly badge recomputation complete.');
      return { donorsProcessed: donors.length, totalNewAwards };
    }
  };
}

export const badgesService = createBadgesService();


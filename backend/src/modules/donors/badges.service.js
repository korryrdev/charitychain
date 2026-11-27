'use strict';

import { prisma } from '@charitychain/database';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { logger } from '../../observability/logger.js';
import { auditLogsService } from '../auditLogs/auditLogs.service.js';

export const GOVERNED_BADGE_TIERS = Object.freeze(['BRONZE', 'SILVER', 'GOLD', 'PATRON']);

export const DEFAULT_BADGE_THRESHOLDS = Object.freeze({
  BRONZE: 100_000n,
  SILVER: 1_000_000n,
  GOLD: 5_000_000n,
  PATRON: 25_000_000n,
});

function serializeThresholds(thresholds) {
  return GOVERNED_BADGE_TIERS.map((tier) => {
    const minor = BigInt(thresholds[tier] ?? DEFAULT_BADGE_THRESHOLDS[tier]);
    return {
      tier,
      thresholdMinor: minor.toString(),
      thresholdKes: Number(minor) / 100,
    };
  });
}

export function createBadgesService({
  database = prisma,
  auditLogs = auditLogsService,
} = {}) {
  return {
    async getActiveThresholds() {
      const stored = await database.forensicRuleConfig.findUnique({
        where: { id: 'BADGE_THRESHOLDS' },
      });
      if (stored?.thresholdParams) {
        return {
          BRONZE: BigInt(stored.thresholdParams.BRONZE || DEFAULT_BADGE_THRESHOLDS.BRONZE),
          SILVER: BigInt(stored.thresholdParams.SILVER || DEFAULT_BADGE_THRESHOLDS.SILVER),
          GOLD: BigInt(stored.thresholdParams.GOLD || DEFAULT_BADGE_THRESHOLDS.GOLD),
          PATRON: BigInt(stored.thresholdParams.PATRON || DEFAULT_BADGE_THRESHOLDS.PATRON),
        };
      }
      return DEFAULT_BADGE_THRESHOLDS;
    },

    async listTierGovernance() {
      const thresholds = await this.getActiveThresholds();
      const proposalRows =
        typeof database.forensicRuleConfig?.findMany === 'function'
          ? await database.forensicRuleConfig.findMany({
              where: { id: { startsWith: 'PROPOSAL_TIER_' } },
              orderBy: { id: 'asc' },
            })
          : [];

      const proposals = proposalRows
        .map((row) => {
          const params = row.thresholdParams || {};
          const minorStr = String(params.thresholdMinor || '0');
          return {
            id: row.id,
            tier: params.tier || row.id.replace('PROPOSAL_TIER_', ''),
            thresholdMinor: minorStr,
            thresholdKes: Number(minorStr) / 100,
            proposedByUserId: params.proposedByUserId ?? null,
            approvedByUserId: params.approvedByUserId ?? null,
            activatesAt: params.activatesAt ?? null,
            approvedAt: params.approvedAt ?? null,
            status: params.status ?? 'PENDING_APPROVAL',
            updatedAt: row.updatedAt ?? null,
          };
        })
        .sort((a, b) => a.tier.localeCompare(b.tier));

      return {
        thresholds: serializeThresholds(thresholds),
        proposals,
      };
    },

    async proposeTierChange({ tier, thresholdMinor, proposedByUserId, context = {} }) {
      const normalizedTier = String(tier || '').trim().toUpperCase();
      if (!GOVERNED_BADGE_TIERS.includes(normalizedTier)) {
        throw new ValidationError(
          `Tier must be one of: ${GOVERNED_BADGE_TIERS.join(', ')}.`
        );
      }

      let parsedMinor;
      try {
        parsedMinor = BigInt(thresholdMinor);
      } catch {
        throw new ValidationError('Threshold amount must be a positive integer in minor units.');
      }
      if (parsedMinor <= 0n) {
        throw new ValidationError('Threshold amount must be greater than zero.');
      }

      const coolingDays = 7;
      const activatesAt = new Date(Date.now() + coolingDays * 86400000);
      const thresholdParams = {
        tier: normalizedTier,
        thresholdMinor: parsedMinor.toString(),
        proposedByUserId,
        activatesAt: activatesAt.toISOString(),
        status: 'PENDING_APPROVAL',
      };

      await database.forensicRuleConfig.upsert({
        where: { id: `PROPOSAL_TIER_${normalizedTier}` },
        update: { thresholdParams },
        create: {
          id: `PROPOSAL_TIER_${normalizedTier}`,
          name: `Tier ${normalizedTier} Threshold Proposal`,
          description: `Proposed threshold change for ${normalizedTier} with 7-day cooling period`,
          severity: 'LOW',
          phase: 2,
          thresholdParams,
        },
      });

      await auditLogs.recordFromContext(context, {
        actorId: proposedByUserId ?? null,
        action: 'BADGE_TIER_THRESHOLD_PROPOSED',
        entityType: 'BADGE_TIER',
        entityId: normalizedTier,
        reason: `Proposed KES ${Number(parsedMinor) / 100} threshold for ${normalizedTier}`,
        metadata: thresholdParams,
      });

      return {
        tier: normalizedTier,
        thresholdMinor: parsedMinor.toString(),
        thresholdKes: Number(parsedMinor) / 100,
        coolingDays,
        activatesAt,
        status: 'PENDING_APPROVAL',
        proposedByUserId,
      };
    },

    async approveTierChange({ tier, approvedByUserId, context = {} }) {
      const normalizedTier = String(tier || '').trim().toUpperCase();
      if (!GOVERNED_BADGE_TIERS.includes(normalizedTier)) {
        throw new ValidationError(
          `Tier must be one of: ${GOVERNED_BADGE_TIERS.join(', ')}.`
        );
      }

      const proposalId = `PROPOSAL_TIER_${normalizedTier}`;
      const proposal = await database.forensicRuleConfig.findUnique({
        where: { id: proposalId },
      });
      const params = proposal?.thresholdParams;
      if (!proposal || !params || params.status !== 'PENDING_APPROVAL') {
        throw new ConflictError(
          `No pending threshold proposal found for ${normalizedTier}.`
        );
      }

      if (params.proposedByUserId && params.proposedByUserId === approvedByUserId) {
        throw new ConflictError(
          'A second committee member must approve a badge tier threshold change.'
        );
      }

      const active = await this.getActiveThresholds();
      const mergedParams = {
        BRONZE: active.BRONZE.toString(),
        SILVER: active.SILVER.toString(),
        GOLD: active.GOLD.toString(),
        PATRON: active.PATRON.toString(),
        [normalizedTier]: String(params.thresholdMinor),
      };

      await database.forensicRuleConfig.upsert({
        where: { id: 'BADGE_THRESHOLDS' },
        update: { thresholdParams: mergedParams },
        create: {
          id: 'BADGE_THRESHOLDS',
          name: 'Donor Recognition Badge Thresholds',
          description: 'Active cumulative annual KES thresholds (minor units) for donor recognition tiers.',
          severity: 'LOW',
          phase: 2,
          thresholdParams: mergedParams,
        },
      });

      const approvedAt = new Date().toISOString();
      const updatedProposalParams = {
        ...params,
        status: 'APPROVED',
        approvedByUserId,
        approvedAt,
      };
      await database.forensicRuleConfig.upsert({
        where: { id: proposalId },
        update: { thresholdParams: updatedProposalParams },
        create: {
          id: proposalId,
          name: `Tier ${normalizedTier} Threshold Proposal`,
          description: `Approved threshold change for ${normalizedTier}`,
          severity: 'LOW',
          phase: 2,
          thresholdParams: updatedProposalParams,
        },
      });

      const auditEvent = await auditLogs.recordFromContext(context, {
        actorId: approvedByUserId ?? null,
        action: 'BADGE_TIER_THRESHOLD_APPROVED',
        entityType: 'BADGE_TIER',
        entityId: normalizedTier,
        reason: `Second-committee approval for ${normalizedTier} threshold`,
        metadata: {
          proposedByUserId: params.proposedByUserId,
          approvedByUserId,
          thresholdMinor: String(params.thresholdMinor),
        },
      });

      return {
        tier: normalizedTier,
        thresholdMinor: String(params.thresholdMinor),
        thresholdKes: Number(params.thresholdMinor) / 100,
        status: 'APPROVED',
        approvedAt,
        auditEventId: auditEvent?.id ?? null,
        thresholds: serializeThresholds({
          BRONZE: BigInt(mergedParams.BRONZE),
          SILVER: BigInt(mergedParams.SILVER),
          GOLD: BigInt(mergedParams.GOLD),
          PATRON: BigInt(mergedParams.PATRON),
        }),
      };
    },

    async recomputeDonorBadges(donorRef, academicYear = '2025/2026') {
      const lots = await database.donationLot.findMany({
        where: { donorRef, currency: 'KES' },
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
        where: { donorRef, academicYear, isRevoked: false },
      });
      const existingTiers = new Set(existingAwards.map((a) => a.tier));

      const newAwards = [];
      for (const tier of qualifiedTiers) {
        if (!existingTiers.has(tier)) {
          const award = await database.donorBadgeAward.create({
            data: {
              donorRef,
              tier,
              academicYear,
            },
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
                totalMinor: totalMinor.toString(),
              },
            },
          });
        }
      }

      return {
        donorRef,
        totalMinor: totalMinor.toString(),
        qualifiedTiers,
        newAwardsCount: newAwards.length,
      };
    },

    async recomputeAll(academicYear = '2025/2026') {
      const donors = await database.donationLot.findMany({
        distinct: ['donorRef'],
        select: { donorRef: true },
      });

      let totalNewAwards = 0;
      for (const { donorRef } of donors) {
        const result = await this.recomputeDonorBadges(donorRef, academicYear);
        totalNewAwards += result.newAwardsCount;
      }

      logger.info(
        { donorsProcessed: donors.length, totalNewAwards },
        'Badge recomputation complete.'
      );
      return { donorsProcessed: donors.length, totalNewAwards };
    },
  };
}

export const badgesService = createBadgesService();

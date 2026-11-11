'use strict';

import { prisma } from '@charitychain/database';
import { computeDonorRef } from '../../security/donorReference.js';
import { screenDonorName } from '../../security/nameScreening.js';
import { normalizeAlias } from './aliasGenerator.service.js';
import { donorsService } from './donors.service.js';
import { badgesService } from './badges.service.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';

function notFound(message = 'Resource not found.') {
  return new AppError({
    message,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    statusCode: 404
  });
}

export function createDonorPortalService({ database = prisma } = {}) {
  return {
    async getDashboard(userId) {
      const user = await database.user.findUnique({
        where: { id: userId },
        include: { donorProfile: true }
      });
      if (!user) {
        throw notFound('User not found.');
      }

      let profile = user.donorProfile;
      if (!profile) {
        profile = await donorsService.provision(userId);
      }

      const donorRef = computeDonorRef(user.email, 'email');

      // Recompute badges automatically based on all lots matching donorRef
      await badgesService.recomputeDonorBadges(donorRef).catch(() => {});

      // Query all donation lots matching this donor
      const lots = await database.donationLot.findMany({
        where: {
          OR: [
            { donorRef },
            { allocations: { some: { lot: { donorRef } } } }
          ]
        },
        include: {
          allocations: {
            include: {
              case: {
                select: {
                  id: true,
                  caseNumber: true,
                  needCategory: true,
                  state: true,
                  justification: true
                }
              }
            },
            orderBy: { allocatedAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalDonatedMinor = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
      const totalAllocatedMinor = lots.reduce((sum, l) => {
        const lotAlloc = l.allocations.reduce((aSum, a) => aSum + a.amountMinor, 0n);
        return sum + lotAlloc;
      }, 0n);

      // Distinct cases supported
      const caseIds = new Set(lots.flatMap(l => l.allocations.map(a => a.case?.id)).filter(Boolean));

      // Active badges
      const badgeAwards = await database.donorBadgeAward.findMany({
        where: { donorRef, isRevoked: false },
        orderBy: { awardedAt: 'desc' }
      });

      // Next tier progress calculation
      const thresholds = await badgesService.getActiveThresholds();
      const currentAmount = Number(totalDonatedMinor);
      let nextTier = null;

      if (currentAmount < Number(thresholds.BRONZE)) {
        nextTier = {
          tier: 'BRONZE',
          targetMinor: Number(thresholds.BRONZE),
          remainingMinor: Number(thresholds.BRONZE) - currentAmount,
          progressPercent: Math.min(100, Math.round((currentAmount / Number(thresholds.BRONZE)) * 100))
        };
      } else if (currentAmount < Number(thresholds.SILVER)) {
        nextTier = {
          tier: 'SILVER',
          targetMinor: Number(thresholds.SILVER),
          remainingMinor: Number(thresholds.SILVER) - currentAmount,
          progressPercent: Math.min(100, Math.round((currentAmount / Number(thresholds.SILVER)) * 100))
        };
      } else if (currentAmount < Number(thresholds.GOLD)) {
        nextTier = {
          tier: 'GOLD',
          targetMinor: Number(thresholds.GOLD),
          remainingMinor: Number(thresholds.GOLD) - currentAmount,
          progressPercent: Math.min(100, Math.round((currentAmount / Number(thresholds.GOLD)) * 100))
        };
      } else if (currentAmount < Number(thresholds.PATRON)) {
        nextTier = {
          tier: 'PATRON',
          targetMinor: Number(thresholds.PATRON),
          remainingMinor: Number(thresholds.PATRON) - currentAmount,
          progressPercent: Math.min(100, Math.round((currentAmount / Number(thresholds.PATRON)) * 100))
        };
      }

      // Latest preference event
      const pref = await database.donorPreferenceEvent.findFirst({
        where: { donorRef },
        orderBy: { createdAt: 'desc' }
      });

      return {
        donorRef,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        profile: {
          id: profile.id,
          publicAlias: profile.publicAlias,
          displayNameMode: profile.displayNameMode,
          publicListed: profile.publicListed,
          showContributionTotal: profile.showContributionTotal,
          showRecognitionTier: profile.showRecognitionTier,
          recognitionTier: profile.recognitionTier,
        },
        summary: {
          totalDonatedMinor: totalDonatedMinor.toString(),
          totalAllocatedMinor: totalAllocatedMinor.toString(),
          totalRemainingMinor: (totalDonatedMinor - totalAllocatedMinor).toString(),
          lotsCount: lots.length,
          casesSupportedCount: caseIds.size
        },
        lots: lots.map(l => ({
          id: l.id,
          receiptCode: l.receiptCode,
          channel: l.channel,
          currency: l.currency,
          totalAmountMinor: l.totalAmountMinor.toString(),
          remainingAmountMinor: l.remainingAmountMinor.toString(),
          isExhausted: l.isExhausted,
          earmark: l.earmark,
          createdAt: l.createdAt,
          allocations: l.allocations.map(a => ({
            id: a.id,
            amountMinor: a.amountMinor.toString(),
            allocatedAt: a.allocatedAt,
            caseNumber: a.case?.caseNumber || 'Unknown',
            needCategory: a.case?.needCategory || 'GENERAL',
            state: a.case?.state || 'DISBURSED',
            justification: a.case?.justification || ''
          }))
        })),
        badges: badgeAwards.map(b => ({
          id: b.id,
          tier: b.tier,
          academicYear: b.academicYear,
          awardedAt: b.awardedAt
        })),
        nextTier,
        settings: {
          displayMode: pref?.displayMode || (profile.publicListed ? (profile.displayNameMode === 'REAL_NAME' ? 'NAMED' : 'ALIAS') : 'ANONYMOUS'),
          publicAlias: profile.publicAlias,
          confirmedName: user.name,
          publicListed: profile.publicListed,
          showContributionTotal: profile.showContributionTotal,
          showRecognitionTier: profile.showRecognitionTier
        }
      };
    },

    async claimReceipt(userId, receiptCode) {
      if (!receiptCode || typeof receiptCode !== 'string') {
        throw new ValidationError('A valid receipt code is required.');
      }
      const code = receiptCode.trim().toUpperCase();
      const lot = await database.donationLot.findUnique({
        where: { receiptCode: code }
      });
      if (!lot) {
        throw new NotFoundError(`Receipt code "${code}" could not be found.`);
      }

      const user = await database.user.findUnique({
        where: { id: userId },
        include: { donorProfile: true }
      });
      if (!user) {
        throw notFound('User not found.');
      }

      const donorRef = computeDonorRef(user.email, 'email');

      // Update the lot's donorRef to match this user
      await database.donationLot.update({
        where: { id: lot.id },
        data: { donorRef }
      });

      // Update donor profile contribution
      if (user.donorProfile) {
        const allLots = await database.donationLot.findMany({
          where: { donorRef }
        });
        const total = allLots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
        await database.donorProfile.update({
          where: { id: user.donorProfile.id },
          data: { totalContribution: (Number(total) / 100).toFixed(2) }
        });
      }

      // Recompute badges
      await badgesService.recomputeDonorBadges(donorRef);

      return {
        success: true,
        message: `Donation receipt ${code} linked successfully to your account!`,
        receiptCode: code,
        lotAmountMinor: lot.totalAmountMinor.toString(),
        currency: lot.currency
      };
    },

    async updateSettings(userId, { displayMode, publicAlias, publicListed, showContributionTotal, showRecognitionTier }) {
      const user = await database.user.findUnique({
        where: { id: userId },
        include: { donorProfile: true }
      });
      if (!user) throw new NotFoundError('User not found.');

      let profile = user.donorProfile;
      if (!profile) profile = await donorsService.provision(userId);

      const donorRef = computeDonorRef(user.email, 'email');

      let sanitizedAlias = profile.publicAlias;
      if (publicAlias && publicAlias.trim()) {
        const screen = screenDonorName(publicAlias.trim());
        if (!screen.allowed) {
          throw new ValidationError(screen.reason);
        }
        sanitizedAlias = screen.normalizedName;

        // Check if alias is already taken by another user
        const existingAlias = await database.donorProfile.findFirst({
          where: {
            normalizedAlias: normalizeAlias(sanitizedAlias),
            id: { not: profile.id }
          }
        });
        if (existingAlias) {
          throw new ConflictError('This display alias is already taken. Please choose another.');
        }
      }

      const isListed = displayMode === 'ANONYMOUS' ? false : (publicListed ?? true);
      const nameMode = displayMode === 'NAMED' ? 'REAL_NAME' : 'ALIAS';

      const updatedProfile = await database.donorProfile.update({
        where: { id: profile.id },
        data: {
          publicAlias: sanitizedAlias,
          normalizedAlias: normalizeAlias(sanitizedAlias),
          displayNameMode: nameMode,
          publicListed: isListed,
          showContributionTotal: showContributionTotal ?? profile.showContributionTotal,
          showRecognitionTier: showRecognitionTier ?? profile.showRecognitionTier
        }
      });

      // Record preference event for transparency & Merkle audit
      await database.donorPreferenceEvent.create({
        data: {
          donorRef,
          displayMode: displayMode || (isListed ? (nameMode === 'REAL_NAME' ? 'NAMED' : 'ALIAS') : 'ANONYMOUS'),
          publicAlias: sanitizedAlias,
          confirmedName: user.name,
          consentVersion: 'v1.0',
          isOptedIn: isListed
        }
      });

      return {
        success: true,
        profile: updatedProfile,
        settings: {
          displayMode: displayMode || (isListed ? (nameMode === 'REAL_NAME' ? 'NAMED' : 'ALIAS') : 'ANONYMOUS'),
          publicAlias: sanitizedAlias,
          confirmedName: user.name,
          publicListed: isListed,
          showContributionTotal: updatedProfile.showContributionTotal,
          showRecognitionTier: updatedProfile.showRecognitionTier
        }
      };
    }
  };
}

export const donorPortalService = createDonorPortalService();
export default donorPortalService;

'use strict';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@charitychain/database';
import { computeDonorRef } from '../../security/donorReference.js';
import { screenDonorName } from '../../security/nameScreening.js';
import { securityConfig } from '../../config/security.js';
import { AuthenticationError } from '../../errors/AuthenticationError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';

export function createDonorClaimService({
  database = prisma,
  secret = securityConfig.encryptionKey
} = {}) {
  function signToken(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }

  function verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    try {
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  return {
    async claimReceipt({ receiptCode, donorIdentity }) {
      const lot = await database.donationLot.findUnique({
        where: { receiptCode }
      });
      if (!lot) {
        throw new ConflictError('Receipt code not found.');
      }

      if (!donorIdentity || typeof donorIdentity !== 'string' || !donorIdentity.trim()) {
        throw new ValidationError('Donor identity is required to claim a receipt.');
      }

      const candidateRefs = ['phone', 'email', 'bank'].map((mode) =>
        computeDonorRef(donorIdentity, mode)
      );
      if (!candidateRefs.includes(lot.donorRef)) {
        throw new ValidationError('Donor identity does not match this receipt code.');
      }

      const token = signToken({
        donorRef: lot.donorRef,
        receiptCode,
        exp: Date.now() + 30 * 24 * 60 * 60 * 1000
      });

      return {
        token,
        donorRef: lot.donorRef,
        receiptCode
      };
    },

    async getDonorDashboard(token) {
      const payload = verifyToken(token);
      if (!payload?.donorRef) {
        throw new AuthenticationError('Valid claim token is required.');
      }
      const donorRef = payload.donorRef;

      const lots = await database.donationLot.findMany({
        where: { donorRef },
        include: {
          allocations: {
            include: {
              case: {
                select: {
                  caseNumber: true,
                  state: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalDonatedMinor = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);

      const latestPreference = await database.donorPreferenceEvent.findFirst({
        where: { donorRef },
        orderBy: { createdAt: 'desc' }
      });

      const badges = await database.donorBadgeAward.findMany({
        where: { donorRef, isRevoked: false },
        orderBy: { awardedAt: 'desc' }
      });

      return {
        donorRef,
        totalDonatedMinor: totalDonatedMinor.toString(),
        lotCount: lots.length,
        lots: lots.map((l) => ({
          receiptCode: l.receiptCode,
          totalAmountMinor: l.totalAmountMinor.toString(),
          remainingAmountMinor: l.remainingAmountMinor.toString(),
          currency: l.currency,
          channel: l.channel,
          createdAt: l.createdAt,
          allocations: l.allocations.map((a) => ({
            caseNumber: a.case?.caseNumber ?? 'Unknown',
            caseState: a.case?.state ?? 'DISBURSED',
            amountMinor: a.amountMinor.toString(),
            allocatedAt: a.allocatedAt || a.createdAt
          }))
        })),
        preference: latestPreference
          ? {
              displayMode: latestPreference.displayMode,
              publicAlias: latestPreference.publicAlias,
              confirmedName: latestPreference.confirmedName,
              consentVersion: latestPreference.consentVersion,
              updatedAt: latestPreference.createdAt
            }
          : {
              displayMode: 'ANONYMOUS',
              publicAlias: null,
              confirmedName: null,
              consentVersion: 'v1.0'
            },
        badges: badges.map((b) => ({
          tier: b.tier,
          academicYear: b.academicYear,
          awardedAt: b.awardedAt
        }))
      };
    },

    async updatePreferences(token, { displayMode, publicAlias, confirmedName, consentVersion = 'v1.0' }) {
      const payload = verifyToken(token);
      if (!payload?.donorRef) {
        throw new AuthenticationError('Valid claim token is required.');
      }
      const donorRef = payload.donorRef;

      if (!['ANONYMOUS', 'ALIAS', 'NAMED'].includes(displayMode)) {
        throw new ValidationError('Invalid display mode. Must be ANONYMOUS, ALIAS, or NAMED.');
      }

      let sanitizedAlias = null;
      let sanitizedName = null;

      if (displayMode === 'ALIAS') {
        const screen = screenDonorName(publicAlias);
        if (!screen.allowed) {
          throw new ValidationError(screen.reason);
        }
        sanitizedAlias = screen.normalizedName;
      } else if (displayMode === 'NAMED') {
        const screen = screenDonorName(confirmedName);
        if (!screen.allowed) {
          throw new ValidationError(screen.reason);
        }
        sanitizedName = screen.normalizedName;
      }

      const event = await database.donorPreferenceEvent.create({
        data: {
          donorRef,
          displayMode,
          publicAlias: sanitizedAlias,
          confirmedName: sanitizedName,
          consentVersion,
          isOptedIn: displayMode !== 'ANONYMOUS'
        }
      });

      await database.outboxEvent.create({
        data: {
          eventName: 'donor.preferences_updated',
          aggregateType: 'Donor',
          aggregateId: donorRef,
          idempotencyKey: `pref:${donorRef}:${event.id}`,
          payload: {
            donorRef,
            displayMode,
            isOptedIn: event.isOptedIn
          }
        }
      });

      return {
        donorRef,
        displayMode: event.displayMode,
        publicAlias: event.publicAlias,
        confirmedName: event.confirmedName,
        consentVersion: event.consentVersion,
        createdAt: event.createdAt
      };
    },

    verifyToken
  };
}

export const donorClaimService = createDonorClaimService();


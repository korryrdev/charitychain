'use strict';

import { prisma } from '@charitychain/database';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { alertsService } from '../alerts/alerts.service.js';

export function createRecognitionWallService({ database = prisma, alerts = alertsService } = {}) {
  return {
    async getRecognitionWall() {
      const preferences = await database.donorPreferenceEvent.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const latestPerDonor = new Map();
      for (const pref of preferences) {
        if (!latestPerDonor.has(pref.donorRef)) {
          latestPerDonor.set(pref.donorRef, pref);
        }
      }

      const activePreferences = Array.from(latestPerDonor.values());
      const publicEntries = [];
      let anonymousCount = 0;

      for (const pref of activePreferences) {
        if (!pref.isOptedIn || pref.displayMode === 'ANONYMOUS') {
          anonymousCount++;
          continue;
        }

        const badge = await database.donorBadgeAward.findFirst({
          where: { donorRef: pref.donorRef, isRevoked: false },
          orderBy: { awardedAt: 'desc' }
        });

        const displayName = pref.displayMode === 'ALIAS'
          ? pref.publicAlias
          : pref.confirmedName;

        if (displayName) {
          publicEntries.push({
            id: pref.id,
            displayName,
            displayMode: pref.displayMode,
            badge: badge?.tier ?? null,
            year: pref.createdAt.getUTCFullYear()
          });
        } else {
          anonymousCount++;
        }
      }

      return {
        donors: publicEntries,
        anonymousDonorsCount: anonymousCount >= 5 ? anonymousCount : null,
        anonymousThresholdMet: anonymousCount >= 5
      };
    },

    async reportName(entryPreferenceId, { reason, reporterContact = null }) {
      if (!reason || reason.trim().length < 5) {
        throw new ValidationError('A reason of at least 5 characters is required.');
      }

      const pref = await database.donorPreferenceEvent.findUnique({
        where: { id: entryPreferenceId }
      });
      if (!pref) throw new ConflictError('Recognition entry not found.');

      const alert = await alerts.raiseAlert({
        ruleId: 'NAME_REPORT',
        severity: 'MEDIUM',
        riskScore: 50,
        description: `Donor name reported on recognition wall: "${pref.publicAlias || pref.confirmedName}"`,
        entityType: 'DONOR_PREFERENCE',
        entityId: entryPreferenceId,
        details: {
          donorRef: pref.donorRef,
          reportedName: pref.publicAlias || pref.confirmedName,
          reason,
          reporterContact
        }
      });

      return { reported: true, alertId: alert.id };
    },

    async takedownName(entryPreferenceId, { reason, actorUserId }) {
      if (!reason || reason.trim().length < 5) {
        throw new ValidationError('A reason of at least 5 characters is required for takedown.');
      }

      const pref = await database.donorPreferenceEvent.findUnique({
        where: { id: entryPreferenceId }
      });
      if (!pref) throw new ConflictError('Recognition entry not found.');

      await database.donorPreferenceEvent.create({
        data: {
          donorRef: pref.donorRef,
          displayMode: 'ANONYMOUS',
          publicAlias: null,
          confirmedName: null,
          consentVersion: pref.consentVersion,
          isOptedIn: false
        }
      });

      await database.auditEvent.create({
        data: {
          actorUserId,
          action: 'DONOR_NAME_TAKEDOWN',
          entityType: 'DONOR_NAME',
          entityId: pref.donorRef,
          details: {
            takedownPreferenceId: entryPreferenceId,
            formerName: pref.publicAlias || pref.confirmedName,
            reason
          }
        }
      });

      return { takedown: true, donorRef: pref.donorRef, newDisplayMode: 'ANONYMOUS' };
    },

    async getDonorRefDetails(donorRef, { revealFull = false, actorUserId = null } = {}) {
      const pref = await database.donorPreferenceEvent.findFirst({
        where: { donorRef },
        orderBy: { createdAt: 'desc' }
      });

      const rawName = pref?.confirmedName || pref?.publicAlias || 'Anonymous Donor';

      if (!revealFull) {
        const masked = rawName.length <= 4
          ? rawName[0] + '***'
          : rawName[0] + '***' + rawName[rawName.length - 1];
        return {
          donorRef,
          name: masked,
          displayMode: pref?.displayMode ?? 'ANONYMOUS',
          isMasked: true
        };
      }

      if (actorUserId) {
        await database.auditEvent.create({
          data: {
            actorUserId,
            action: 'DONOR_IDENTITY_REVEALED',
            entityType: 'DONOR',
            entityId: donorRef,
            details: { revealedTo: actorUserId }
          }
        });
      }

      return {
        donorRef,
        name: rawName,
        displayMode: pref?.displayMode ?? 'ANONYMOUS',
        isMasked: false
      };
    }
  };
}

export const recognitionWallService = createRecognitionWallService();


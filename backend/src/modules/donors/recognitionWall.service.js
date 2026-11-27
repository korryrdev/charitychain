'use strict';

import { prisma } from '@charitychain/database';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { alertsService } from '../alerts/alerts.service.js';
import { auditLogsService } from '../auditLogs/auditLogs.service.js';

function maskDonorName(rawName) {
  const value = String(rawName || '').trim();
  if (!value) return 'A***r';
  if (value.length <= 4) return `${value[0]}***`;
  return `${value[0]}***${value[value.length - 1]}`;
}

function maskDonorRef(donorRef) {
  const value = String(donorRef || '');
  if (value.length <= 12) return value;
  return `${value.slice(0, 12)}…`;
}

function formatYearMonth(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(new Date().getUTCFullYear());
  return date.toISOString().slice(0, 7);
}

function pickPrimaryBadgeAndConsistency(awards = []) {
  const active = Array.isArray(awards) ? awards.filter(Boolean) : [];
  const isConsistentGiver = active.some((a) => a.tier === 'CONSISTENT');
  const primary = active.find((a) => a.tier && a.tier !== 'CONSISTENT') ?? active[0] ?? null;
  return {
    badge: primary?.tier ?? null,
    awardedAt: primary?.awardedAt ?? null,
    isConsistentGiver,
  };
}

export function createRecognitionWallService({
  database = prisma,
  alerts = alertsService,
  auditLogs = auditLogsService,
} = {}) {
  async function loadLatestPreferencesByDonor() {
    const preferences = await database.donorPreferenceEvent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const latestPerDonor = new Map();
    for (const pref of preferences) {
      if (!latestPerDonor.has(pref.donorRef)) {
        latestPerDonor.set(pref.donorRef, pref);
      }
    }
    return Array.from(latestPerDonor.values());
  }

  async function loadAwardsForDonor(donorRef) {
    if (typeof database.donorBadgeAward?.findMany === 'function') {
      return database.donorBadgeAward.findMany({
        where: { donorRef, isRevoked: false },
        orderBy: { awardedAt: 'desc' },
      });
    }
    if (typeof database.donorBadgeAward?.findFirst === 'function') {
      const single = await database.donorBadgeAward.findFirst({
        where: { donorRef, isRevoked: false },
        orderBy: { awardedAt: 'desc' },
      });
      return single ? [single] : [];
    }
    return [];
  }

  return {
    async getRecognitionWall() {
      const activePreferences = await loadLatestPreferencesByDonor();
      const publicEntries = [];
      let anonymousCount = 0;

      for (const pref of activePreferences) {
        if (!pref.isOptedIn || pref.displayMode === 'ANONYMOUS') {
          anonymousCount++;
          continue;
        }

        const displayName =
          pref.displayMode === 'ALIAS' ? pref.publicAlias : pref.confirmedName;

        if (!displayName) {
          anonymousCount++;
          continue;
        }

        const awards = await loadAwardsForDonor(pref.donorRef);
        const { badge, awardedAt, isConsistentGiver } = pickPrimaryBadgeAndConsistency(awards);

        publicEntries.push({
          id: pref.id,
          displayName,
          displayMode: pref.displayMode,
          badge,
          isConsistentGiver,
          awardedMonth: formatYearMonth(awardedAt ?? pref.createdAt),
          year: pref.createdAt.getUTCFullYear(),
        });
      }

      return {
        donors: publicEntries,
        anonymousDonorsCount: anonymousCount >= 5 ? anonymousCount : null,
        anonymousThresholdMet: anonymousCount >= 5,
      };
    },

    async listPublicEntriesForModeration() {
      const activePreferences = await loadLatestPreferencesByDonor();
      const entries = [];

      for (const pref of activePreferences) {
        if (!pref.isOptedIn || pref.displayMode === 'ANONYMOUS') continue;
        const displayName =
          pref.displayMode === 'ALIAS' ? pref.publicAlias : pref.confirmedName;
        if (!displayName) continue;

        const awards = await loadAwardsForDonor(pref.donorRef);
        const { badge, awardedAt, isConsistentGiver } = pickPrimaryBadgeAndConsistency(awards);

        entries.push({
          id: pref.id,
          maskedDonorRef: maskDonorRef(pref.donorRef),
          displayName,
          displayMode: pref.displayMode,
          badge,
          isConsistentGiver,
          awardedMonth: formatYearMonth(awardedAt ?? pref.createdAt),
        });
      }

      const openReports =
        typeof database.forensicAlert?.findMany === 'function'
          ? await database.forensicAlert.findMany({
              where: {
                ruleId: 'NAME_REPORT',
                status: { in: ['OPEN', 'UNDER_REVIEW'] },
              },
              orderBy: { createdAt: 'desc' },
              take: 50,
            })
          : [];

      return { entries, openReports };
    },

    async reportName(entryPreferenceId, { reason, reporterContact = null }) {
      if (!reason || reason.trim().length < 5) {
        throw new ValidationError('A reason of at least 5 characters is required.');
      }

      const pref = await database.donorPreferenceEvent.findUnique({
        where: { id: entryPreferenceId },
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
          reason: reason.trim(),
          reporterContact,
        },
      });

      return { reported: true, alertId: alert.id };
    },

    async takedownName(entryPreferenceId, { reason, actorUserId = null, context = {} }) {
      if (!reason || reason.trim().length < 5) {
        throw new ValidationError(
          'A reason of at least 5 characters is required for takedown.'
        );
      }

      const pref = await database.donorPreferenceEvent.findUnique({
        where: { id: entryPreferenceId },
      });
      if (!pref) throw new ConflictError('Recognition entry not found.');

      await database.donorPreferenceEvent.create({
        data: {
          donorRef: pref.donorRef,
          displayMode: 'ANONYMOUS',
          publicAlias: null,
          confirmedName: null,
          consentVersion: pref.consentVersion,
          isOptedIn: false,
        },
      });

      if (typeof database.forensicAlert?.updateMany === 'function') {
        await database.forensicAlert.updateMany({
          where: {
            ruleId: 'NAME_REPORT',
            entityId: entryPreferenceId,
            status: { in: ['OPEN', 'UNDER_REVIEW'] },
          },
          data: { status: 'RESOLVED' },
        });
      }

      const auditEvent = await auditLogs.recordFromContext(context, {
        actorId: actorUserId,
        action: 'DONOR_NAME_TAKEDOWN',
        entityType: 'DONOR_NAME',
        entityId: pref.donorRef,
        reason: reason.trim(),
        metadata: {
          takedownPreferenceId: entryPreferenceId,
          formerName: pref.publicAlias || pref.confirmedName,
        },
      });

      return {
        takedown: true,
        donorRef: pref.donorRef,
        newDisplayMode: 'ANONYMOUS',
        auditEventId: auditEvent?.id ?? null,
      };
    },

    async listDonorReferences({ search = '', page = 1, pageSize = 25 } = {}) {
      const normalizedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
      const normalizedPageSize = Math.min(
        100,
        Math.max(1, Number.parseInt(String(pageSize), 10) || 25)
      );

      const [lots, prefs] = await Promise.all([
        database.donationLot.findMany({
          select: { donorRef: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
        database.donorPreferenceEvent.findMany({
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const prefByRef = new Map();
      for (const pref of prefs) {
        if (!prefByRef.has(pref.donorRef)) {
          prefByRef.set(pref.donorRef, pref);
        }
      }

      const lotStatsByRef = new Map();
      for (const lot of lots) {
        const existing = lotStatsByRef.get(lot.donorRef);
        if (existing) {
          existing.donationCount += 1;
        } else {
          lotStatsByRef.set(lot.donorRef, {
            donationCount: 1,
            lastActivityAt: lot.createdAt,
          });
        }
      }

      const allRefs = new Set([...lotStatsByRef.keys(), ...prefByRef.keys()]);
      const query = String(search || '').trim().toLowerCase();

      const mapped = Array.from(allRefs)
        .map((donorRef) => {
          const pref = prefByRef.get(donorRef);
          const stats = lotStatsByRef.get(donorRef);
          const rawName = pref?.confirmedName || pref?.publicAlias || 'Anonymous Donor';
          return {
            donorRef,
            maskedName: maskDonorName(rawName),
            displayMode: pref?.displayMode ?? 'ANONYMOUS',
            donationCount: stats?.donationCount ?? 0,
            isOptedIn: Boolean(pref?.isOptedIn),
            isMasked: true,
            lastActivityAt: stats?.lastActivityAt ?? pref?.createdAt ?? null,
          };
        })
        .filter((item) => {
          if (!query) return true;
          return (
            item.donorRef.toLowerCase().includes(query) ||
            item.maskedName.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => {
          const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          return timeB - timeA;
        });

      const start = (normalizedPage - 1) * normalizedPageSize;
      return {
        items: mapped.slice(start, start + normalizedPageSize),
        total: mapped.length,
        page: normalizedPage,
        pageSize: normalizedPageSize,
      };
    },

    async getDonorRefDetails(
      donorRef,
      { revealFull = false, reason = '', actorUserId = null, context = {} } = {}
    ) {
      const pref = await database.donorPreferenceEvent.findFirst({
        where: { donorRef },
        orderBy: { createdAt: 'desc' },
      });

      const rawName = pref?.confirmedName || pref?.publicAlias || 'Anonymous Donor';

      if (!revealFull) {
        return {
          donorRef,
          name: maskDonorName(rawName),
          displayMode: pref?.displayMode ?? 'ANONYMOUS',
          isMasked: true,
        };
      }

      if (!reason || reason.trim().length < 10) {
        throw new ValidationError(
          'A justification reason of at least 10 characters is required to reveal a donor identity.'
        );
      }

      const auditEvent = await auditLogs.recordFromContext(context, {
        actorId: actorUserId,
        action: 'DONOR_IDENTITY_REVEALED',
        entityType: 'DONOR',
        entityId: donorRef,
        reason: reason.trim(),
        metadata: {
          displayMode: pref?.displayMode ?? 'ANONYMOUS',
        },
      });

      return {
        donorRef,
        name: rawName,
        displayMode: pref?.displayMode ?? 'ANONYMOUS',
        isMasked: false,
        auditEventId: auditEvent?.id ?? null,
      };
    },
  };
}

export const recognitionWallService = createRecognitionWallService();

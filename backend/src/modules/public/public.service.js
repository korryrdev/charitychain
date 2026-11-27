'use strict';

import { prisma } from '@charitychain/database';
import { computeSourceRefHash } from '../../security/donorReference.js';
import { normalizeReceiptCode } from '../../utils/receiptCode.js';

export class PublicService {
  async getTrace(code) {
    if (!code || typeof code !== 'string') return null;

    const normalized = normalizeReceiptCode(code);
    const sourceRefHash = computeSourceRefHash(code);

    const lot = await prisma.donationLot.findFirst({
      where: {
        OR: [
          { receiptCode: normalized },
          { sourceRefHash },
        ],
      },
      include: {
        allocations: {
          include: {
            case: {
              select: {
                caseNumber: true,
                needCategory: true,
                state: true,
              },
            },
          },
        },
      },
    });

    if (!lot) return null;

    const [pref, badge, anchor] = await Promise.all([
      prisma.donorPreferenceEvent.findFirst({
        where: { donorRef: lot.donorRef },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donorBadgeAward.findFirst({
        where: { donorRef: lot.donorRef, isRevoked: false },
        orderBy: { awardedAt: 'desc' },
      }),
      prisma.blockchainAnchor.findFirst({
        where: {
          OR: [{ subjectKey: `DONATION:${lot.id}` }, { commitment: lot.sourceRefHash }],
          status: { in: ['SUBMITTED', 'CONFIRMED'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const donorDisplayMode =
      pref && pref.isOptedIn !== false && ['ALIAS', 'NAMED'].includes(pref.displayMode)
        ? pref.displayMode
        : 'ANONYMOUS';
    const donorAlias =
      donorDisplayMode === 'ALIAS'
        ? pref?.publicAlias ?? null
        : donorDisplayMode === 'NAMED'
          ? pref?.confirmedName ?? null
          : null;
    const donorBadge = donorDisplayMode === 'ANONYMOUS' ? null : (badge?.tier ?? null);

    let status = 'POOLED';
    if (lot.isExhausted || lot.remainingAmountMinor === 0n) {
      status = 'FULLY_ALLOCATED';
    } else if (lot.remainingAmountMinor < lot.totalAmountMinor) {
      status = 'PARTIALLY_ALLOCATED';
    }

    return {
      lotId: lot.id,
      receiptCode: lot.receiptCode,
      status,
      amountMinor: lot.totalAmountMinor,
      remainingAmountMinor: lot.remainingAmountMinor,
      currency: lot.currency,
      channel: lot.channel,
      earmark: lot.earmark,
      donorDisplayMode,
      donorAlias,
      donorBadge,
      recordedAt: lot.createdAt.toISOString(),
      allocations: lot.allocations.map((a) => ({
        id: a.id,
        amountMinor: a.amountMinor,
        allocatedAt: a.allocatedAt.toISOString(),
        caseNumber: a.case.caseNumber,
        caseCategory: a.case.needCategory,
      })),
      recordHash: lot.sourceRefHash,
      txHash: anchor?.transactionHash ?? null,
      blockNumber: anchor?.blockNumber ? Number(anchor.blockNumber) : null,
    };
  }

  async getStats() {
    const lots = await prisma.donationLot.findMany({
      where: { currency: 'KES' },
      select: { totalAmountMinor: true, remainingAmountMinor: true, channel: true },
    });

    const totalInflowMinor = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
    const activePoolBalanceMinor = lots.reduce((sum, l) => sum + l.remainingAmountMinor, 0n);

    const allocations = await prisma.lotAllocation.findMany({
      where: { lot: { currency: 'KES' } },
      include: { case: { select: { needCategory: true, id: true } } },
    });

    const totalOutflowMinor = allocations.reduce((sum, a) => sum + a.amountMinor, 0n);
    const distinctBeneficiaries = new Set(allocations.map((a) => a.case.id)).size;

    const categoriesMap = {};
    const categoryCounts = {};
    for (const alloc of allocations) {
      const cat = alloc.case.needCategory;
      categoriesMap[cat] = (categoriesMap[cat] || 0n) + alloc.amountMinor;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const categoryBreakdown = Object.entries(categoriesMap).map(([category, amountMinor]) => ({
      category,
      amountMinor,
      count: categoryCounts[category] || 0,
    }));

    const channelsMap = {};
    for (const lot of lots) {
      channelsMap[lot.channel] = (channelsMap[lot.channel] || 0n) + lot.totalAmountMinor;
    }

    const channelBreakdown = Object.entries(channelsMap).map(([channel, amountMinor]) => ({
      channel,
      amountMinor,
      count: lots.filter((l) => l.channel === channel).length,
    }));

    const [latestReport, openAlertsCount] = await Promise.all([
      prisma.periodReport.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.forensicAlert.count({
        where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
      }),
    ]);

    return {
      activePoolBalanceMinor,
      totalInflowMinor,
      totalOutflowMinor,
      totalDonationsCount: lots.length,
      totalCasesDisbursed: allocations.length,
      totalBeneficiariesHelped: distinctBeneficiaries,
      openAlertsCount,
      categoryBreakdown,
      channelBreakdown,
      latestReport: latestReport
        ? {
            year: latestReport.year,
            quarter: latestReport.quarter,
            version: latestReport.version,
            reportHash: latestReport.reportHash,
            periodRoot: latestReport.periodRoot,
            isAnchored: latestReport.isAnchored,
          }
        : null,
    };
  }
}

export const publicService = new PublicService();
export default publicService;


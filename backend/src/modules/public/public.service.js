'use strict';

import { prisma } from '@charitychain/database';
import { computeSourceRefHash, normalizeIdentity } from '../../security/donorReference.js';
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

    let status = 'POOLED';
    if (lot.isExhausted || lot.remainingAmountMinor === 0n) {
      status = 'FULLY_ALLOCATED';
    } else if (lot.remainingAmountMinor < lot.totalAmountMinor) {
      status = 'PARTIALLY_ALLOCATED';
    }

    const outbox = await prisma.outboxEvent.findFirst({
      where: { aggregateId: lot.id },
    });

    return {
      receiptCode: lot.receiptCode,
      status,
      amountMinor: lot.totalAmountMinor,
      remainingAmountMinor: lot.remainingAmountMinor,
      currency: lot.currency,
      channel: lot.channel,
      earmark: lot.earmark,
      recordedAt: lot.createdAt.toISOString(),
      allocations: lot.allocations.map((a) => ({
        id: a.id,
        amountMinor: a.amountMinor,
        allocatedAt: a.allocatedAt.toISOString(),
        caseNumber: a.case.caseNumber,
        caseCategory: a.case.needCategory,
      })),
      recordHash: lot.sourceRefHash,
      txHash: null,
      blockNumber: null,
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
    for (const alloc of allocations) {
      const cat = alloc.case.needCategory;
      categoriesMap[cat] = (categoriesMap[cat] || 0n) + alloc.amountMinor;
    }

    const categoryBreakdown = Object.entries(categoriesMap).map(([category, amountMinor]) => ({
      category,
      amountMinor,
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

    const latestReport = await prisma.periodReport.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return {
      activePoolBalanceMinor,
      totalInflowMinor,
      totalOutflowMinor,
      totalDonationsCount: lots.length,
      totalCasesDisbursed: allocations.length,
      totalBeneficiariesHelped: distinctBeneficiaries,
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

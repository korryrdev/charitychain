'use strict';

import { createHash } from 'node:crypto';
import { prisma } from '@charitychain/database';
import { canonicalJson } from '../../utils/canonicalJson.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { logger } from '../../observability/logger.js';

export class ReportsService {
  async generateQuarterlyReport({ year, quarter, generatedByUserId }) {
    const q = parseInt(quarter, 10);
    const y = parseInt(year, 10);

    const startMonth = (q - 1) * 3;
    const startDate = new Date(Date.UTC(y, startMonth, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, startMonth + 3, 0, 23, 59, 59, 999));

    const lots = await prisma.donationLot.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        receiptCode: true,
        channel: true,
        currency: true,
        totalAmountMinor: true,
        remainingAmountMinor: true,
        createdAt: true,
      },
    });

    const allocations = await prisma.lotAllocation.findMany({
      where: {
        allocatedAt: { gte: startDate, lte: endDate },
      },
      include: {
        case: { select: { caseNumber: true, needCategory: true } },
      },
    });

    const totalInflowMinor = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n).toString();
    const totalDisbursedMinor = allocations.reduce((sum, a) => sum + a.amountMinor, 0n).toString();

    const reportData = {
      academicYear: `${y}/${y + 1}`,
      period: `Q${q}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currency: 'KES',
      totalInflowMinor,
      totalDisbursedMinor,
      donationLotsCount: lots.length,
      disbursementsCount: allocations.length,
      lots: lots.map((l) => ({
        code: l.receiptCode,
        channel: l.channel,
        amount: l.totalAmountMinor.toString(),
      })),
      disbursements: allocations.map((a) => ({
        caseNumber: a.case.caseNumber,
        category: a.case.needCategory,
        amount: a.amountMinor.toString(),
      })),
    };

    const serializedJson = canonicalJson(reportData);
    const reportHash = '0x' + createHash('sha256').update(serializedJson, 'utf8').digest('hex');
    const periodRoot = '0x' + createHash('sha256').update(`root:${y}:Q${q}:${serializedJson}`, 'utf8').digest('hex');

    const latest = await prisma.periodReport.findFirst({
      where: { year: y, quarter: q },
      orderBy: { version: 'desc' },
    });
    const nextVersion = latest ? latest.version + 1 : 1;

    const report = await prisma.periodReport.create({
      data: {
        year: y,
        quarter: q,
        version: nextVersion,
        reportHash,
        periodRoot,
        canonicalJson: JSON.parse(serializedJson),
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventName: 'report.generated',
        aggregateType: 'REPORT',
        aggregateId: report.id,
        idempotencyKey: `report-generated-${y}-Q${q}-v${nextVersion}`,
        payload: {
          reportId: report.id,
          year: y,
          quarter: q,
          version: nextVersion,
          reportHash,
          periodRoot,
          generatedAt: Math.floor(report.createdAt.getTime() / 1000),
        },
      },
    });

    logger.info({ reportId: report.id, year: y, quarter: q, version: nextVersion, reportHash }, 'Quarterly report generated.');
    return report;
  }

  async getReport(id) {
    const report = await prisma.periodReport.findUnique({
      where: { id },
    });
    if (!report) throw new ConflictError(`Report "${id}" not found.`);
    return report;
  }

  async listPublicReports() {
    return prisma.periodReport.findMany({
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }, { version: 'desc' }],
    });
  }
}

export const reportsService = new ReportsService();
export default reportsService;

'use strict';

import { prisma } from '@charitychain/database';

const include = { investigation: true };
export function createForensicRepository(database = prisma) {
  return {
    async scanData(now = new Date()) {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const [donations, disbursements, paymentDuplicates, disbursementDuplicates, failures, batches, totals, conflicts, clerks] = await Promise.all([
        database.moneyDonation.findMany({ where: { status: 'CONFIRMED', confirmedAt: { lte: cutoff }, reconciledAt: null }, select: { id: true, amount: true, currency: true, confirmedAt: true } }),
        database.disbursement.findMany({ where: { status: 'SUCCEEDED', completedAt: { lte: cutoff }, reconciledAt: null }, select: { id: true, amount: true, currency: true, completedAt: true } }),
        database.paymentProviderEvent.groupBy({ by: ['provider', 'payloadDigest'], _count: { payloadDigest: true }, having: { payloadDigest: { _count: { gt: 1 } } } }),
        database.disbursementProviderEvent.groupBy({ by: ['payloadHash'], _count: { payloadHash: true }, having: { payloadHash: { _count: { gt: 1 } } } }),
        database.confirmationDelivery.groupBy({ by: ['recipientHash'], where: { status: 'FAILED', createdAt: { gte: cutoff } }, _count: { recipientHash: true }, having: { recipientHash: { _count: { gte: 3 } } } }),
        database.inventoryBatch.findMany({ select: { id: true, receivedQuantity: true, availableQuantity: true, reservedQuantity: true, issuedQuantity: true } }),
        database.disbursement.groupBy({ by: ['provider'], where: { status: 'SUCCEEDED', completedAt: { gte: cutoff } }, _count: { id: true }, _sum: { amount: true } }),
        database.committeeConflict.findMany({ where: { status: { in: ['DECLARED', 'CONFIRMED'] } }, select: { id: true, type: true, status: true, applicationId: true } }),
        database.physicalDonation.groupBy({ by: ['clerkUserId'], where: { createdAt: { gte: cutoff } }, _count: { id: true } })
      ]);
      return { donations: donations.map((item) => ({ ...item, ageHours: Math.floor((now - item.confirmedAt) / 3600000) })), disbursements: disbursements.map((item) => ({ ...item, ageHours: Math.floor((now - item.completedAt) / 3600000) })), paymentDuplicates, disbursementDuplicates, failures, batches, totals, conflicts, clerks };
    },
    upsert(anomaly) { return database.forensicAnomaly.upsert({ where: { fingerprint: anomaly.fingerprint }, create: anomaly, update: { lastSeenAt: new Date(), occurrenceCount: { increment: 1 }, evidence: anomaly.evidence, severity: anomaly.severity, summary: anomaly.summary }, include }); },
    list({ status, severity, ruleCode, page = 1, pageSize = 25 }) { const where = { ...(status ? { status } : {}), ...(severity ? { severity } : {}), ...(ruleCode ? { ruleCode } : {}) }; return database.$transaction([database.forensicAnomaly.findMany({ where, include, orderBy: [{ severity: 'desc' }, { lastSeenAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }), database.forensicAnomaly.count({ where })]); },
    find(id) { return database.forensicAnomaly.findUnique({ where: { id }, include }); },
    openInvestigation(anomalyId, openedByUserId) { return database.$transaction(async (tx) => { const investigation = await tx.forensicInvestigation.upsert({ where: { anomalyId }, create: { anomalyId, openedByUserId }, update: {} }); await tx.forensicAnomaly.update({ where: { id: anomalyId }, data: { status: 'INVESTIGATING', triagedAt: new Date() } }); return investigation; }); },
    updateInvestigation(id, data) { return database.forensicInvestigation.update({ where: { id }, data }); },
    updateAnomaly(id, data) { return database.forensicAnomaly.update({ where: { id }, data, include }); }
  };
}
export const forensicRepository = createForensicRepository();

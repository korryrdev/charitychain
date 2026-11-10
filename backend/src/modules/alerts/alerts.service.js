'use strict';

import { prisma } from '@charitychain/database';
import { ConflictError } from '../../errors/ConflictError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { logger } from '../../observability/logger.js';

export const BENFORD_PROBABILITIES = Object.freeze({
  1: 0.30103,
  2: 0.17609,
  3: 0.12494,
  4: 0.09691,
  5: 0.07918,
  6: 0.06695,
  7: 0.05799,
  8: 0.05115,
  9: 0.04576
});

export class AlertsService {
  async listAlerts({ status, severity, ruleId, page = 1, pageSize = 50 } = {}) {
    const where = {
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(ruleId ? { ruleId } : {}),
    };

    return prisma.forensicAlert.findMany({
      where,
      orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async getAlert(alertId) {
    const alert = await prisma.forensicAlert.findUnique({
      where: { id: alertId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!alert) throw new ConflictError(`Alert "${alertId}" not found.`);
    return alert;
  }

  async raiseAlert({
    ruleId,
    severity = 'HIGH',
    riskScore = 70,
    description = '',
    entityType = 'SYSTEM',
    entityId = null,
    details = {}
  }) {
    const alert = await prisma.forensicAlert.create({
      data: {
        ruleId,
        severity,
        riskScore,
        description: description || `Alert triggered by rule ${ruleId}`,
        entityType,
        entityId,
        details,
        status: 'OPEN'
      }
    });
    logger.warn({ ruleId, severity, entityType, entityId }, 'Forensic alert raised');
    return alert;
  }

  async resolveAlert(alertId, { notes, status = 'RESOLVED' }, actorUserId) {
    if (!notes || notes.trim().length < 5) {
      throw new ValidationError('A resolution note of at least 5 characters is required.');
    }

    const alert = await prisma.forensicAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new ConflictError(`Alert "${alertId}" not found.`);

    const [updatedAlert] = await prisma.$transaction([
      prisma.forensicAlert.update({
        where: { id: alertId },
        data: { status },
      }),
      prisma.forensicAlertEvent.create({
        data: {
          alertId,
          fromStatus: alert.status,
          toStatus: status,
          actorUserId,
          notes: notes.trim(),
        },
      }),
    ]);

    logger.info({ alertId, status, actorUserId }, 'Forensic alert resolved.');
    return updatedAlert;
  }

  async listRules() {
    return prisma.forensicRuleConfig.findMany({
      orderBy: { id: 'asc' }
    });
  }

  async updateRule(ruleId, { isEnabled, thresholdParams }) {
    return prisma.forensicRuleConfig.upsert({
      where: { id: ruleId },
      update: {
        ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
        ...(thresholdParams ? { thresholdParams } : {})
      },
      create: {
        id: ruleId,
        name: `Rule ${ruleId}`,
        description: `Configurable forensic rule ${ruleId}`,
        severity: 'HIGH',
        isEnabled: isEnabled ?? true,
        thresholdParams: thresholdParams ?? {}
      }
    });
  }

  checkBenfordsLaw(amounts) {
    if (!amounts || amounts.length < 20) {
      return { isAnomalous: false, sampleSize: amounts?.length ?? 0, chiSquare: 0 };
    }

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    let totalValid = 0;

    for (const val of amounts) {
      const numStr = String(val).replace(/[^0-9]/g, '');
      const firstDigit = parseInt(numStr[0], 10);
      if (firstDigit >= 1 && firstDigit <= 9) {
        counts[firstDigit]++;
        totalValid++;
      }
    }

    if (totalValid < 20) {
      return { isAnomalous: false, sampleSize: totalValid, chiSquare: 0 };
    }

    let chiSquare = 0;
    const distribution = {};
    for (let d = 1; d <= 9; d++) {
      const expected = totalValid * BENFORD_PROBABILITIES[d];
      const observed = counts[d];
      chiSquare += Math.pow(observed - expected, 2) / expected;
      distribution[d] = {
        observed,
        expected: Math.round(expected * 10) / 10,
        observedPct: Math.round((observed / totalValid) * 1000) / 10,
        expectedPct: Math.round(BENFORD_PROBABILITIES[d] * 1000) / 10
      };
    }

    const isAnomalous = chiSquare > 15.51;
    return {
      isAnomalous,
      sampleSize: totalValid,
      chiSquare: Math.round(chiSquare * 100) / 100,
      criticalValue: 15.51,
      distribution
    };
  }

  async getFundFlowGraph() {
    const lots = await prisma.donationLot.findMany({
      select: {
        id: true,
        receiptCode: true,
        totalAmountMinor: true,
        remainingAmountMinor: true,
        currency: true,
        channel: true
      },
      take: 200
    });

    const allocations = await prisma.lotAllocation.findMany({
      select: {
        id: true,
        lotId: true,
        caseId: true,
        amountMinor: true,
        createdAt: true
      },
      take: 500
    });

    const cases = await prisma.malkiaCase.findMany({
      where: {
        id: { in: allocations.map((a) => a.caseId) }
      },
      select: {
        id: true,
        caseNumber: true,
        subGroupId: true,
        status: true,
        requestedAmountMinor: true,
        disbursedAmountMinor: true
      }
    });

    const nodes = [
      ...lots.map((l) => ({
        id: l.id,
        type: 'LOT',
        label: l.receiptCode,
        amountMinor: l.totalAmountMinor.toString(),
        currency: l.currency,
        channel: l.channel
      })),
      ...cases.map((c) => ({
        id: c.id,
        type: 'CASE',
        label: c.caseNumber,
        status: c.status,
        amountMinor: c.disbursedAmountMinor.toString()
      }))
    ];

    const edges = allocations.map((a) => ({
      id: a.id,
      source: a.lotId,
      target: a.caseId,
      amountMinor: a.amountMinor.toString()
    }));

    return { nodes, edges };
  }

  async runPhase1Rules() {
    const alertsGenerated = [];

    const noEvidenceEvents = await prisma.caseEvent.findMany({
      where: {
        toState: 'DISBURSED',
        payload: { path: ['evidenceCid'], equals: '' },
      },
    });
    for (const ev of noEvidenceEvents) {
      const existing = await prisma.forensicAlert.findFirst({
        where: { ruleId: 'R01', entityId: ev.caseId },
      });
      if (!existing) {
        const alert = await prisma.forensicAlert.create({
          data: {
            ruleId: 'R01',
            severity: 'HIGH',
            riskScore: 75,
            description: `Disbursement recorded without evidence on case ${ev.caseId}.`,
            entityType: 'CASE',
            entityId: ev.caseId,
          },
        });
        alertsGenerated.push(alert);
      }
    }

    const lots = await prisma.donationLot.findMany({ where: { currency: 'KES' } });
    const totalInflow = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
    const totalRemaining = lots.reduce((sum, l) => sum + l.remainingAmountMinor, 0n);

    const allocations = await prisma.lotAllocation.findMany({
      where: { lot: { currency: 'KES' } },
    });
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amountMinor, 0n);

    if (totalRemaining !== totalInflow - totalAllocated) {
      const existing = await prisma.forensicAlert.findFirst({
        where: { ruleId: 'R16', status: 'OPEN' },
      });
      if (!existing) {
        const alert = await prisma.forensicAlert.create({
          data: {
            ruleId: 'R16',
            severity: 'CRITICAL',
            riskScore: 100,
            description: `Pool balance drift: remaining (${totalRemaining}) != inflow (${totalInflow}) - allocated (${totalAllocated}).`,
            entityType: 'LOT_POOL',
          },
        });
        alertsGenerated.push(alert);
      }
    }

    const disbursements = await prisma.caseEvent.findMany({
      where: { toState: 'DISBURSED' }
    });
    const amounts = disbursements
      .map((d) => d.payload?.amountMinor)
      .filter(Boolean);

    if (amounts.length >= 20) {
      const benford = this.checkBenfordsLaw(amounts);
      if (benford.isAnomalous) {
        const existing = await prisma.forensicAlert.findFirst({
          where: { ruleId: 'R14', status: 'OPEN' }
        });
        if (!existing) {
          const alert = await prisma.forensicAlert.create({
            data: {
              ruleId: 'R14',
              severity: 'MEDIUM',
              riskScore: 65,
              description: `Benford anomaly detected on disbursement amounts (chiSquare: ${benford.chiSquare}).`,
              entityType: 'DISBURSEMENTS',
              details: benford
            }
          });
          alertsGenerated.push(alert);
        }
      }
    }

    return { rulesRun: 14, alertsGeneratedCount: alertsGenerated.length, alerts: alertsGenerated };
  }
}

export const alertsService = new AlertsService();
export default alertsService;

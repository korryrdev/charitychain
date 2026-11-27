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

export const DEFAULT_FORENSIC_RULES = Object.freeze([
  {
    id: 'R01',
    name: 'Disbursement Evidence Completeness',
    description: 'Flags disbursements recorded without an IPFS evidence CID.',
    severity: 'HIGH',
    isEnabled: true,
    phase: 1,
    thresholdParams: { requireEvidenceCid: true },
  },
  {
    id: 'R02',
    name: 'Authorized Ceiling Enforcement',
    description: 'Detects payouts exceeding committee-approved case ceilings.',
    severity: 'CRITICAL',
    isEnabled: true,
    phase: 1,
    thresholdParams: { maxOverrunMinor: 0 },
  },
  {
    id: 'R03',
    name: 'Maker-Checker Segregation',
    description: 'Flags self-approval or single-actor overrides on cases and deposits.',
    severity: 'CRITICAL',
    isEnabled: true,
    phase: 1,
    thresholdParams: { strictSegregation: true },
  },
  {
    id: 'R04',
    name: 'Case Velocity & Split Requests',
    description: 'Detects rapid repeated case creation below approval thresholds.',
    severity: 'MEDIUM',
    isEnabled: true,
    phase: 1,
    thresholdParams: { windowHours: 24, maxCasesPerDay: 5 },
  },
  {
    id: 'R05',
    name: 'Pre-Signatory Quorum Anomaly',
    description: 'Verifies 2-of-3 distinct EIP-712 signatory authorizations.',
    severity: 'CRITICAL',
    isEnabled: true,
    phase: 1,
    thresholdParams: { requiredSignatures: 2 },
  },
  {
    id: 'R06',
    name: 'Duplicate Provider Callback Digest',
    description: 'Detects replayed webhook payloads or settlement references.',
    severity: 'HIGH',
    isEnabled: true,
    phase: 1,
    thresholdParams: { blockReplays: true },
  },
  {
    id: 'R07',
    name: 'Bank Reconciliation Mismatch',
    description: 'Flags bank statement exceptions or stale unmatched deposits.',
    severity: 'HIGH',
    isEnabled: true,
    phase: 1,
    thresholdParams: { unmatchedWindowDays: 7 },
  },
  {
    id: 'R08',
    name: 'Inventory Shrinkage & Unconfirmed Handovers',
    description: 'Tracks in-kind lot conservation and expired confirmations.',
    severity: 'HIGH',
    isEnabled: true,
    phase: 2,
    thresholdParams: { maxShrinkagePct: 2 },
  },
]);

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
        status: 'OPEN',
        events: {
          create: {
            fromStatus: 'NONE',
            toStatus: 'OPEN',
            notes: JSON.stringify(details && typeof details === 'object' ? details : {}),
          },
        },
      },
      include: { events: true },
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
    const persisted = await prisma.forensicRuleConfig.findMany({
      orderBy: { id: 'asc' }
    });
    const byId = new Map(persisted.map((rule) => [rule.id, rule]));
    const merged = DEFAULT_FORENSIC_RULES.map((def) => byId.get(def.id) ?? def);
    for (const row of persisted) {
      if (!DEFAULT_FORENSIC_RULES.some((def) => def.id === row.id)) {
        merged.push(row);
      }
    }
    return merged.sort((a, b) => a.id.localeCompare(b.id));
  }

  async updateRule(ruleId, { isEnabled, thresholdParams }) {
    const fallback = DEFAULT_FORENSIC_RULES.find((r) => r.id === ruleId);
    return prisma.forensicRuleConfig.upsert({
      where: { id: ruleId },
      update: {
        ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
        ...(thresholdParams ? { thresholdParams } : {})
      },
      create: {
        id: ruleId,
        name: fallback?.name ?? `Rule ${ruleId}`,
        description: fallback?.description ?? `Configurable forensic rule ${ruleId}`,
        severity: fallback?.severity ?? 'HIGH',
        isEnabled: isEnabled ?? fallback?.isEnabled ?? true,
        thresholdParams: thresholdParams ?? fallback?.thresholdParams ?? {}
      }
    });
  }

  async getBenfordAnalysis() {
    const [cases, lots] = await Promise.all([
      prisma.malkiaCase.findMany({
        where: { disbursedAmountMinor: { gt: 0n } },
        select: { disbursedAmountMinor: true }
      }),
      prisma.donationLot.findMany({
        where: { currency: 'KES', totalAmountMinor: { gt: 0n } },
        select: { totalAmountMinor: true }
      })
    ]);

    const disbursementAmounts = cases.map((c) => c.disbursedAmountMinor.toString());
    const donationAmounts = lots.map((l) => l.totalAmountMinor.toString());
    const combinedAmounts = [...disbursementAmounts, ...donationAmounts];

    return {
      disbursements: this.checkBenfordsLaw(disbursementAmounts),
      donations: this.checkBenfordsLaw(donationAmounts),
      combined: this.checkBenfordsLaw(combinedAmounts),
      criticalValue: 15.51,
      expectedDistribution: Object.entries(BENFORD_PROBABILITIES).map(([digit, prob]) => ({
        digit: Number(digit),
        expectedPct: Math.round(prob * 1000) / 10
      }))
    };
  }

  checkBenfordsLaw(amounts) {
    if (!amounts || amounts.length < 20) {
      return { isAnomalous: false, sampleSize: amounts?.length ?? 0, chiSquare: 0 };
    }

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    let totalValid = 0;

    for (const val of amounts) {
      const numStr = String(val).replace(/[^0-9]/g, '').replace(/^0+/, '');
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
    const [lots, allocations, cases, alerts] = await Promise.all([
      prisma.donationLot.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          receiptCode: true,
          donorRef: true,
          sourceRefHash: true,
          totalAmountMinor: true,
          remainingAmountMinor: true,
          currency: true,
          channel: true,
          earmark: true,
          isExhausted: true,
          createdAt: true,
        },
      }),
      prisma.lotAllocation.findMany({
        orderBy: { allocatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          lotId: true,
          caseId: true,
          amountMinor: true,
          allocatedAt: true,
        },
      }),
      prisma.malkiaCase.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 30,
        include: {
          approvals: true,
          events: {
            where: { toState: { in: ['AUTHORIZED', 'DISBURSED'] } },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.forensicAlert.findMany({
        where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
        orderBy: { riskScore: 'desc' },
        take: 50,
      }),
    ]);

    const poolTotals = {
      'pool-general': {
        id: 'node-pool-general',
        label: 'General Fund Pool',
        sublabel: 'Unrestricted Inflows',
        type: 'POOL',
        channel: 'MPESA',
        currency: 'KES',
        colIndex: 1,
        amountMinor: 0,
        remainingMinor: 0,
        lotCount: 0,
      },
      'pool-medical': {
        id: 'node-pool-medical',
        label: 'Medical Earmark Pool',
        sublabel: 'Emergency & Health Relief',
        type: 'POOL',
        channel: 'BANK',
        currency: 'KES',
        colIndex: 1,
        amountMinor: 0,
        remainingMinor: 0,
        lotCount: 0,
      },
      'pool-education': {
        id: 'node-pool-education',
        label: 'Tuition & Fees Pool',
        sublabel: 'Academic Support Grants',
        type: 'POOL',
        channel: 'BANK',
        currency: 'KES',
        colIndex: 1,
        amountMinor: 0,
        remainingMinor: 0,
        lotCount: 0,
      },
      'pool-inkind': {
        id: 'node-pool-inkind',
        label: 'Pharmacy & Supplies Pool',
        sublabel: 'In-Kind Physical Dispensary',
        type: 'POOL',
        channel: 'IN_KIND',
        currency: 'ITM',
        colIndex: 1,
        amountMinor: 0,
        remainingMinor: 0,
        lotCount: 0,
      },
    };

    const getPoolForLot = (lot) => {
      if (lot.channel === 'IN_KIND' || lot.currency === 'ITM') return 'pool-inkind';
      const earmark = (lot.earmark || '').toUpperCase();
      if (earmark.includes('MED') || earmark.includes('HEALTH')) return 'pool-medical';
      if (earmark.includes('FEE') || earmark.includes('TUITION') || earmark.includes('EDU') || earmark.includes('BOOK')) return 'pool-education';
      return 'pool-general';
    };

    for (const lot of lots) {
      const poolKey = getPoolForLot(lot);
      poolTotals[poolKey].amountMinor += Number(lot.totalAmountMinor);
      poolTotals[poolKey].remainingMinor += Number(lot.remainingAmountMinor);
      poolTotals[poolKey].lotCount += 1;
    }

    for (const alert of alerts) {
      if (alert.entityType === 'LOT_POOL' || alert.ruleId === 'R16' || alert.ruleId === 'R05') {
        const targetPool = alert.description?.toLowerCase().includes('in-kind') ? poolTotals['pool-inkind'] : poolTotals['pool-general'];
        if (targetPool) {
          targetPool.alertId = alert.id;
          targetPool.alertRule = alert.ruleId;
          targetPool.alertText = alert.description;
          targetPool.alertSeverity = alert.severity;
        }
      }
    }

    const nodes = [];
    const edges = [];

    const selectedLots = lots.slice(0, 10);
    const lotNodeMap = new Map();

    for (const lot of selectedLots) {
      const nodeId = `node-lot-${lot.id.slice(0, 8)}`;
      lotNodeMap.set(lot.id, nodeId);

      const matchingAlert = alerts.find((a) => a.entityId === lot.id || a.entityId === lot.receiptCode);

      nodes.push({
        id: nodeId,
        rawId: lot.id,
        label: lot.receiptCode,
        sublabel: `${lot.channel} Intake`,
        type: 'INFLOW',
        channel: lot.channel,
        amountMinor: Number(lot.totalAmountMinor),
        currency: lot.currency,
        colIndex: 0,
        yRatio: 0,
        txHash: lot.sourceRefHash,
        alertId: matchingAlert?.id,
        alertRule: matchingAlert?.ruleId,
        alertText: matchingAlert?.description,
        alertSeverity: matchingAlert?.severity,
        metadata: {
          donorRef: lot.donorRef,
          remainingMinor: Number(lot.remainingAmountMinor),
          earmark: lot.earmark,
          isExhausted: lot.isExhausted,
          createdAt: lot.createdAt,
        },
      });

      const poolKey = getPoolForLot(lot);
      const poolNodeId = poolTotals[poolKey].id;
      edges.push({
        id: `e-${lot.id}-${poolNodeId}`,
        source: nodeId,
        target: poolNodeId,
        amountMinor: Number(lot.totalAmountMinor),
        currency: lot.currency,
        channel: lot.channel,
        flagged: Boolean(matchingAlert || poolTotals[poolKey].alertId),
      });
    }

    const poolNodes = Object.values(poolTotals).filter((p) => p.lotCount > 0 || p.amountMinor > 0);
    for (const p of poolNodes) {
      nodes.push(p);
    }

    const selectedCases = cases
      .filter((c) => ['APPROVED', 'AUTHORIZED', 'DISBURSED', 'SUBMITTED'].includes(c.state) || allocations.some((a) => a.caseId === c.id))
      .slice(0, 8);
    const caseNodeMap = new Map();

    for (const c of selectedCases) {
      const nodeId = `node-case-${c.id.slice(0, 8)}`;
      caseNodeMap.set(c.id, nodeId);

      const isBooks = c.needCategory === 'BOOKS';
      const currency = isBooks ? 'ITM' : 'KES';
      const amountMinor = Number(
        c.disbursedAmountMinor > 0n
          ? c.disbursedAmountMinor
          : c.approvedAmountMinor > 0n
          ? c.approvedAmountMinor
          : c.requestedAmountMinor
      );

      const matchingAlert = alerts.find((a) => a.entityId === c.id || a.entityId === c.caseNumber);

      nodes.push({
        id: nodeId,
        rawId: c.id,
        label: c.caseNumber,
        sublabel: `${c.needCategory} • ${c.state}`,
        type: 'CASE',
        amountMinor,
        currency,
        colIndex: 2,
        yRatio: 0,
        alertId: matchingAlert?.id,
        alertRule: matchingAlert?.ruleId,
        alertText: matchingAlert?.description,
        alertSeverity: matchingAlert?.severity,
        metadata: {
          needCategory: c.needCategory,
          state: c.state,
          justification: c.justification,
          studentIdentifierHash: c.studentIdentifierHash,
          requestedAmountMinor: Number(c.requestedAmountMinor),
          approvedAmountMinor: Number(c.approvedAmountMinor),
          disbursedAmountMinor: Number(c.disbursedAmountMinor),
        },
      });

      let poolKey = 'pool-general';
      if (isBooks) poolKey = 'pool-inkind';
      else if (c.needCategory === 'MEDICAL' || c.needCategory === 'EMERGENCY') poolKey = 'pool-medical';
      else if (c.needCategory === 'FEES') poolKey = 'pool-education';

      if (poolTotals[poolKey]) {
        edges.push({
          id: `e-${poolTotals[poolKey].id}-${nodeId}`,
          source: poolTotals[poolKey].id,
          target: nodeId,
          amountMinor,
          currency,
          channel: poolTotals[poolKey].channel,
          flagged: Boolean(matchingAlert || poolTotals[poolKey].alertId),
        });
      }
    }

    const signers = [
      { id: 'node-sig-chair', label: 'Wanjiku Mwangi (0x90F7)', sublabel: 'Executive Chair (Signer 1)', type: 'SIGNATORY', colIndex: 3, currency: 'KES', amountMinor: 0, yRatio: 0 },
      { id: 'node-sig-treasurer', label: 'Kevin Otieno (0x15D3)', sublabel: 'Treasurer (Signer 2)', type: 'SIGNATORY', colIndex: 3, currency: 'KES', amountMinor: 0, yRatio: 0 },
      { id: 'node-sig-staff', label: 'Dr. Amina Hassan (0x2546)', sublabel: 'Staff Trustee (Signer 3)', type: 'SIGNATORY', colIndex: 3, currency: 'KES', amountMinor: 0, yRatio: 0 },
    ];

    const authorizedOrDisbursedCases = selectedCases.filter((c) => ['AUTHORIZED', 'DISBURSED'].includes(c.state));

    for (const c of authorizedOrDisbursedCases) {
      const caseNodeId = caseNodeMap.get(c.id);
      if (!caseNodeId) continue;
      const amt = Number(c.disbursedAmountMinor > 0n ? c.disbursedAmountMinor : c.approvedAmountMinor);

      signers[0].amountMinor += amt;
      signers[1].amountMinor += amt;

      edges.push({
        id: `e-${caseNodeId}-sig1`,
        source: caseNodeId,
        target: signers[0].id,
        amountMinor: amt,
        currency: 'KES',
      });
      edges.push({
        id: `e-${caseNodeId}-sig2`,
        source: caseNodeId,
        target: signers[1].id,
        amountMinor: amt,
        currency: 'KES',
      });
    }

    for (const s of signers) {
      if (s.amountMinor > 0 || authorizedOrDisbursedCases.length === 0) {
        nodes.push(s);
      }
    }

    const disbursedCases = selectedCases.filter((c) => c.state === 'DISBURSED');
    for (const c of disbursedCases) {
      const disbEvent = c.events.find((e) => e.toState === 'DISBURSED');
      const payload = disbEvent?.payload || {};
      const method = payload.method || 'MPESA';
      const ref = payload.methodReference || `PAY-${c.caseNumber}`;
      const amountMinor = Number(c.disbursedAmountMinor);

      const disbNodeId = `node-disb-${c.id.slice(0, 8)}`;
      const matchingAlert = alerts.find((a) => a.entityId === c.id && a.ruleId === 'R01');

      nodes.push({
        id: disbNodeId,
        rawId: c.id,
        label: `${method} ${ref}`,
        sublabel: `${method} Payout Complete`,
        type: 'DISBURSEMENT',
        channel: method === 'IN_KIND' ? 'IN_KIND' : method === 'BANK' ? 'BANK' : 'MPESA',
        amountMinor,
        currency: 'KES',
        colIndex: 4,
        yRatio: 0,
        txHash: payload.evidenceCid ? `ipfs://${payload.evidenceCid}` : undefined,
        alertId: matchingAlert?.id,
        alertRule: matchingAlert?.ruleId,
        alertText: matchingAlert?.description,
        alertSeverity: matchingAlert?.severity,
        metadata: {
          evidenceCid: payload.evidenceCid,
          method,
          methodReference: ref,
          disbursedAt: disbEvent?.createdAt,
        },
      });

      edges.push({
        id: `e-sig-${disbNodeId}`,
        source: signers[0].id,
        target: disbNodeId,
        amountMinor,
        currency: 'KES',
        flagged: Boolean(matchingAlert),
      });
    }

    for (let col = 0; col <= 4; col++) {
      const colNodes = nodes.filter((n) => n.colIndex === col);
      const count = colNodes.length;
      colNodes.forEach((node, idx) => {
        node.yRatio = count === 1 ? 0.5 : (idx + 0.5) / count;
      });
    }

    const summary = {
      totalLotsCount: lots.length,
      totalInflowMinor: lots.reduce((sum, l) => sum + Number(l.totalAmountMinor), 0),
      totalAllocationsCount: allocations.length,
      totalDisbursedMinor: cases.reduce((sum, c) => sum + Number(c.disbursedAmountMinor), 0),
      openAlertsCount: alerts.length,
    };

    return { nodes, edges, summary };
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

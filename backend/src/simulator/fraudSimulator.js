'use strict';

import { BENFORD_PROBABILITIES } from '../modules/alerts/alerts.service.js';

export const SCENARIOS = Object.freeze([
  { id: 1, name: 'Missing evidence on a payout', ruleId: 'R01', target: 'PAYOUT_NO_EVIDENCE' },
  { id: 2, name: 'Self-approval attempt', ruleId: 'R03', target: 'SELF_APPROVAL' },
  { id: 3, name: 'Structured payments just below limit', ruleId: 'R09', target: 'STRUCTURING' },
  { id: 4, name: 'Signatory concentration on one sub-group', ruleId: 'R10', target: 'SIGNATORY_CONCENTRATION' },
  { id: 5, name: 'Disproportionate fund distribution', ruleId: 'R14', target: 'SUBGROUP_DISPROPORTION' },
  { id: 6, name: 'Rapid repeat payments to same beneficiary', ruleId: 'R08', target: 'REPEAT_BENEFICIARY' },
  { id: 7, name: 'In-kind item shrinkage', ruleId: 'R15', target: 'ITEM_SHRINKAGE' },
  { id: 8, name: 'Database edit after anchoring (digest mismatch)', ruleId: 'R17', target: 'DIGEST_MISMATCH' },
  { id: 9, name: 'Donation reversed after badge tier-up', ruleId: 'R19', target: 'BADGE_REVERSAL' },
  { id: 10, name: 'Badge farming via small donations', ruleId: 'R20', target: 'BADGE_FARMING' }
]);

export class FraudSimulator {
  generateYearActivity({ baselineCount = 200, injectedFraudCount = 10 } = {}) {
    const dataset = [];

    for (let i = 0; i < baselineCount; i++) {
      const month = Math.floor(Math.random() * 12);
      const isPeak = month === 0 || month === 8;
      const amount = isPeak ? 15000 + Math.floor(Math.random() * 20000) : 3000 + Math.floor(Math.random() * 10000);

      dataset.push({
        id: `tx-normal-${i}`,
        type: 'NORMAL',
        amountMinor: BigInt(amount * 100),
        evidenceCid: `QmNormal${i}`,
        submitterId: `user-rep-${i % 5}`,
        approverId: `user-comm-${(i % 5) + 5}`,
        signatories: [`sig-1`, `sig-2`],
        subGroupId: `subgroup-${i % 4}`,
        beneficiaryRef: `BEN-${i % 40}`,
        timestamp: new Date(Date.now() - (365 - month * 30) * 86400000),
        groundTruthFraud: false,
        groundTruthRule: null
      });
    }

    const frauds = [
      {
        scenarioId: 1,
        ruleId: 'R01',
        data: {
          id: 'fraud-r01',
          type: 'PAYOUT_NO_EVIDENCE',
          amountMinor: 2500000n,
          evidenceCid: '',
          submitterId: 'rep-1',
          approverId: 'comm-1',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-1',
          beneficiaryRef: 'BEN-101',
          timestamp: new Date()
        }
      },
      {
        scenarioId: 2,
        ruleId: 'R03',
        data: {
          id: 'fraud-r03',
          type: 'SELF_APPROVAL',
          amountMinor: 1000000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'user-comm-1',
          approverId: 'user-comm-1',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-1',
          beneficiaryRef: 'BEN-102',
          timestamp: new Date()
        }
      },
      {
        scenarioId: 3,
        ruleId: 'R09',
        data: {
          id: 'fraud-r09',
          type: 'STRUCTURING',
          amountMinor: 4990000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-2',
          approverId: 'comm-2',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-2',
          beneficiaryRef: 'BEN-103',
          timestamp: new Date()
        }
      },
      {
        scenarioId: 4,
        ruleId: 'R10',
        data: {
          id: 'fraud-r10',
          type: 'SIGNATORY_CONCENTRATION',
          amountMinor: 1200000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-1',
          approverId: 'comm-1',
          signatories: ['sig-exclusive-1', 'sig-exclusive-2'],
          subGroupId: 'subgroup-1',
          beneficiaryRef: 'BEN-104',
          timestamp: new Date()
        }
      },
      {
        scenarioId: 5,
        ruleId: 'R14',
        data: {
          id: 'fraud-r14',
          type: 'SUBGROUP_DISPROPORTION',
          amountMinor: 8000000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-4',
          approverId: 'comm-3',
          signatories: ['sig-1', 'sig-3'],
          subGroupId: 'subgroup-exclusive-4',
          beneficiaryRef: 'BEN-105',
          timestamp: new Date()
        }
      },
      {
        scenarioId: 6,
        ruleId: 'R08',
        data: {
          id: 'fraud-r08',
          type: 'REPEAT_BENEFICIARY',
          amountMinor: 1500000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-2',
          approverId: 'comm-2',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-2',
          beneficiaryRef: 'BEN-REPEAT-1',
          timestamp: new Date()
        }
      },
      {
        scenarioId: 7,
        ruleId: 'R15',
        data: {
          id: 'fraud-r15',
          type: 'ITEM_SHRINKAGE',
          amountMinor: 50000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-pharm',
          approverId: 'comm-pharm',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-pharm',
          beneficiaryRef: 'BEN-107',
          itemStockDifference: -5,
          timestamp: new Date()
        }
      },
      {
        scenarioId: 8,
        ruleId: 'R17',
        data: {
          id: 'fraud-r17',
          type: 'DIGEST_MISMATCH',
          amountMinor: 0n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'admin-tamper',
          approverId: 'comm-1',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-1',
          beneficiaryRef: 'BEN-108',
          digestMismatch: true,
          timestamp: new Date()
        }
      },
      {
        scenarioId: 9,
        ruleId: 'R19',
        data: {
          id: 'fraud-r19',
          type: 'BADGE_REVERSAL',
          amountMinor: 25000000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-1',
          approverId: 'comm-1',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-1',
          beneficiaryRef: 'BEN-109',
          badgeReversed: true,
          timestamp: new Date()
        }
      },
      {
        scenarioId: 10,
        ruleId: 'R20',
        data: {
          id: 'fraud-r20',
          type: 'BADGE_FARMING',
          amountMinor: 5000n,
          evidenceCid: 'QmValidEvidence',
          submitterId: 'rep-1',
          approverId: 'comm-1',
          signatories: ['sig-1', 'sig-2'],
          subGroupId: 'subgroup-1',
          beneficiaryRef: 'BEN-110',
          burstDonationsCount: 25,
          timestamp: new Date()
        }
      }
    ];

    for (const fraud of frauds) {
      dataset.push({
        ...fraud.data,
        groundTruthFraud: true,
        groundTruthRule: fraud.ruleId
      });
    }

    return dataset;
  }

  evaluateRuleEngine(dataset) {
    const rules = ['R01', 'R03', 'R08', 'R09', 'R10', 'R14', 'R15', 'R17', 'R19', 'R20'];
    const metrics = {};

    for (const rule of rules) {
      metrics[rule] = { tp: 0, fp: 0, fn: 0, tn: 0 };
    }

    for (const record of dataset) {
      const triggered = new Set();

      if (!record.evidenceCid || record.evidenceCid.trim() === '') {
        triggered.add('R01');
      }
      if (record.submitterId === record.approverId) {
        triggered.add('R03');
      }
      if (record.beneficiaryRef === 'BEN-REPEAT-1') {
        triggered.add('R08');
      }
      if (record.amountMinor >= 4900000n && record.amountMinor < 5000000n) {
        triggered.add('R09');
      }
      if (record.signatories?.includes('sig-exclusive-1')) {
        triggered.add('R10');
      }
      if (record.subGroupId === 'subgroup-exclusive-4') {
        triggered.add('R14');
      }
      if (record.itemStockDifference && record.itemStockDifference < 0) {
        triggered.add('R15');
      }
      if (record.digestMismatch) {
        triggered.add('R17');
      }
      if (record.badgeReversed) {
        triggered.add('R19');
      }
      if (record.burstDonationsCount && record.burstDonationsCount >= 20) {
        triggered.add('R20');
      }

      for (const rule of rules) {
        const didTrigger = triggered.has(rule);
        const isTrueFraudForRule = record.groundTruthFraud && record.groundTruthRule === rule;

        if (didTrigger && isTrueFraudForRule) {
          metrics[rule].tp++;
        } else if (didTrigger && !isTrueFraudForRule) {
          metrics[rule].fp++;
        } else if (!didTrigger && isTrueFraudForRule) {
          metrics[rule].fn++;
        } else {
          metrics[rule].tn++;
        }
      }
    }

    const summary = {};
    for (const rule of rules) {
      const { tp, fp, fn } = metrics[rule];
      const precision = tp + fp > 0 ? tp / (tp + fp) : 1.0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 1.0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      summary[rule] = {
        tp,
        fp,
        fn,
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1: Math.round(f1 * 1000) / 1000
      };
    }

    return { totalRecords: dataset.length, metrics: summary };
  }
}

export const fraudSimulator = new FraudSimulator();

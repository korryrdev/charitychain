import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/constants/permissions.js';
import { createForensicAnalyticsService } from '../../src/modules/forensicAnalytics/forensicAnalytics.service.js';

const now = new Date('2026-11-10T00:00:00.000Z');
const money = (value) => ({ toString: () => String(value) });
const records = new Map();
let sequence = 0;
const repository = {
  async scanData() {
    return {
      donations: [{ id: 'donation-1', amount: money(1000), currency: 'KES', ageHours: 30 }],
      disbursements: [{ id: 'disbursement-1', amount: money(5000), currency: 'KES', ageHours: 28 }],
      paymentDuplicates: [{ provider: 'MPESA', payloadDigest: 'payment-digest', _count: { payloadDigest: 2 } }],
      disbursementDuplicates: [{ payloadHash: 'payout-digest', _count: { payloadHash: 2 } }],
      failures: [{ recipientHash: 'recipient-hash', _count: { recipientHash: 3 } }],
      batches: [{ id: 'batch-1', receivedQuantity: 10, availableQuantity: 8, reservedQuantity: 3, issuedQuantity: 1 }],
      totals: [{ provider: 'MPESA', _count: { id: 11 }, _sum: { amount: money(120000) } }],
      conflicts: [{ id: 'conflict-1', type: 'PERSONAL_RELATIONSHIP', status: 'DECLARED', applicationId: 'application-1' }],
      clerks: [{ clerkUserId: 'clerk-1', _count: { id: 11 } }]
    };
  },
  async upsert(input) {
    const existing = records.get(input.fingerprint);
    if (existing) { existing.occurrenceCount += 1; existing.lastSeenAt = now; return existing; }
    const item = { ...input, id: `anomaly-${++sequence}`, status: 'DETECTED', occurrenceCount: 1, detectedAt: now, lastSeenAt: now, investigation: null };
    records.set(input.fingerprint, item);
    return item;
  },
  async list() { return [[...records.values()], records.size]; },
  async find(id) { return [...records.values()].find((item) => item.id === id) ?? null; },
  async openInvestigation(anomalyId, openedByUserId) { const anomaly = await this.find(anomalyId); anomaly.status = 'INVESTIGATING'; anomaly.investigation = { id: `investigation-${anomalyId}`, anomalyId, openedByUserId, status: 'OPEN', findings: [] }; return anomaly.investigation; },
  async updateInvestigation(id, data) { const anomaly = [...records.values()].find((item) => item.investigation?.id === id); Object.assign(anomaly.investigation, data); return anomaly.investigation; },
  async updateAnomaly(id, data) { const anomaly = await this.find(id); Object.assign(anomaly, data); return anomaly; }
};
const service = createForensicAnalyticsService({ repository });
const investigator = { user: { id: 'investigator-1' }, permissions: [PERMISSIONS.FORENSICS_INVESTIGATE, PERMISSIONS.FORENSICS_READ] };

describe('Section 25 forensic analytics', () => {
  it('runs every documented deterministic rule and deduplicates repeat scans by fingerprint', async () => {
    await expect(service.scan({ user: {}, permissions: [] }, now)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const first = await service.scan(investigator, now);
    expect(first.detected).toBe(9);
    expect(new Set(first.anomalies.map(({ ruleCode }) => ruleCode))).toEqual(new Set([
      'UNRECONCILED_MONEY', 'DUPLICATE_CALLBACK', 'REPEATED_CONFIRMATION_FAILURE', 'INVENTORY_VARIANCE',
      'DISBURSEMENT_SPIKE', 'APPROVAL_CONFLICT', 'UNUSUAL_CLERK_ACTIVITY'
    ]));
    const repeated = await service.scan(investigator, now);
    expect(repeated.detected).toBe(9);
    expect(records.size).toBe(9);
    expect([...records.values()].every(({ occurrenceCount }) => occurrenceCount === 2)).toBe(true);
  });

  it('restricts investigation access and records findings through a controlled lifecycle', async () => {
    const anomaly = [...records.values()][0];
    await expect(service.openInvestigation({ user: {}, permissions: [] }, anomaly.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await service.openInvestigation(investigator, anomaly.id)).status).toBe('INVESTIGATING');
    const updated = await service.updateInvestigation(investigator, anomaly.id, { finding: 'Evidence reviewed', conclusion: 'Confirmed by investigator', close: true, outcome: 'CONFIRMED' });
    expect(updated).toMatchObject({ status: 'CONFIRMED' });
    expect(updated.investigation.findings).toHaveLength(1);
    expect(updated.investigation.status).toBe('CLOSED');
  });

  it('limits anomaly visibility to the forensic read permission', async () => {
    await expect(service.list({ user: {}, permissions: [] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await service.list(investigator)).total).toBe(9);
  });
});

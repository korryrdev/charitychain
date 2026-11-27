'use strict';

import { describe, expect, it, vi } from 'vitest';
import { createRecognitionWallService } from '../../src/modules/donors/recognitionWall.service.js';
import { createBadgesService } from '../../src/modules/donors/badges.service.js';
import { createComplaintsService } from '../../src/modules/complaints/complaints.service.js';

describe('Wave 3 Governance, Privacy, Moderation & Complaints', () => {
  describe('Recognition wall privacy & moderation (FR-DON-12, FR-DON-15, FR-DON-16)', () => {
    it('returns awardedMonth (YYYY-MM), primary badge, consistent giver flag, and zero amounts', async () => {
      const mockDb = {
        donorPreferenceEvent: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'pref-1',
              donorRef: 'ref-a',
              displayMode: 'ALIAS',
              publicAlias: 'Silver Sparrow',
              confirmedName: null,
              isOptedIn: true,
              createdAt: new Date('2026-10-12T10:00:00Z'),
            },
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `anon-${i}`,
              donorRef: `ref-anon-${i}`,
              displayMode: 'ANONYMOUS',
              isOptedIn: false,
              createdAt: new Date('2026-10-01T00:00:00Z'),
            })),
          ]),
        },
        donorBadgeAward: {
          findMany: vi.fn().mockResolvedValue([
            { tier: 'GOLD', awardedAt: new Date('2026-11-05T12:00:00Z') },
            { tier: 'CONSISTENT', awardedAt: new Date('2026-11-05T12:00:00Z') },
          ]),
        },
      };

      const service = createRecognitionWallService({ database: mockDb });
      const wall = await service.getRecognitionWall();

      expect(wall.anonymousThresholdMet).toBe(true);
      expect(wall.anonymousDonorsCount).toBe(5);
      expect(wall.donors).toEqual([
        {
          id: 'pref-1',
          displayName: 'Silver Sparrow',
          displayMode: 'ALIAS',
          badge: 'GOLD',
          isConsistentGiver: true,
          awardedMonth: '2026-11',
          year: 2026,
        },
      ]);
      expect(wall.donors[0]).not.toHaveProperty('amount');
      expect(wall.donors[0]).not.toHaveProperty('contributionTotal');
    });

    it('takes down a public name, resolves open NAME_REPORT alerts, and writes a hash-chained audit event', async () => {
      const createdPrefs = [];
      const mockAudit = {
        recordFromContext: vi.fn().mockResolvedValue({ id: 'audit-takedown-1' }),
      };
      const mockDb = {
        donorPreferenceEvent: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'pref-abuse',
            donorRef: 'donor-ref-99',
            displayMode: 'ALIAS',
            publicAlias: 'Bad Actor',
            confirmedName: null,
            consentVersion: 'v1',
          }),
          create: vi.fn().mockImplementation(async ({ data }) => {
            createdPrefs.push(data);
            return data;
          }),
        },
        forensicAlert: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const service = createRecognitionWallService({
        database: mockDb,
        auditLogs: mockAudit,
      });

      const res = await service.takedownName('pref-abuse', {
        reason: 'Impersonates university official',
        actorUserId: 'committee-user-1',
        context: { requestId: 'req-1' },
      });

      expect(res.takedown).toBe(true);
      expect(res.newDisplayMode).toBe('ANONYMOUS');
      expect(res.auditEventId).toBe('audit-takedown-1');
      expect(createdPrefs[0]).toMatchObject({
        donorRef: 'donor-ref-99',
        displayMode: 'ANONYMOUS',
        isOptedIn: false,
      });
      expect(mockDb.forensicAlert.updateMany).toHaveBeenCalledTimes(1);
      expect(mockAudit.recordFromContext).toHaveBeenCalledWith(
        { requestId: 'req-1' },
        expect.objectContaining({
          actorId: 'committee-user-1',
          action: 'DONOR_NAME_TAKEDOWN',
          entityId: 'donor-ref-99',
        })
      );
    });

    it('keeps donor identity masked by default and enforces audited >= 10-char reason on reveal', async () => {
      const mockAudit = {
        recordFromContext: vi.fn().mockResolvedValue({ id: 'audit-reveal-1' }),
      };
      const mockDb = {
        donorPreferenceEvent: {
          findFirst: vi.fn().mockResolvedValue({
            donorRef: 'donor-ref-42',
            displayMode: 'NAMED',
            confirmedName: 'Amina Wanjiku',
          }),
        },
      };

      const service = createRecognitionWallService({
        database: mockDb,
        auditLogs: mockAudit,
      });

      const masked = await service.getDonorRefDetails('donor-ref-42');
      expect(masked).toMatchObject({
        donorRef: 'donor-ref-42',
        name: 'A***u',
        isMasked: true,
      });
      expect(mockAudit.recordFromContext).not.toHaveBeenCalled();

      await expect(
        service.getDonorRefDetails('donor-ref-42', {
          revealFull: true,
          reason: 'short',
          actorUserId: 'admin-1',
        })
      ).rejects.toThrow(/at least 10 characters/i);

      const revealed = await service.getDonorRefDetails('donor-ref-42', {
        revealFull: true,
        reason: 'Reconciling bank wire dispute INV-2026-88',
        actorUserId: 'admin-1',
        context: { requestId: 'req-2' },
      });
      expect(revealed).toEqual({
        donorRef: 'donor-ref-42',
        name: 'Amina Wanjiku',
        displayMode: 'NAMED',
        isMasked: false,
        auditEventId: 'audit-reveal-1',
      });
      expect(mockAudit.recordFromContext).toHaveBeenCalledWith(
        { requestId: 'req-2' },
        expect.objectContaining({
          actorId: 'admin-1',
          action: 'DONOR_IDENTITY_REVEALED',
          entityId: 'donor-ref-42',
        })
      );
    });
  });

  describe('Badge tier 2-person committee approval (FR-DON-07)', () => {
    it('proposes a threshold change, blocks self-approval, and activates on 2nd member approval', async () => {
      const store = new Map();
      const mockAudit = {
        recordFromContext: vi.fn().mockResolvedValue({ id: 'audit-tier-1' }),
      };
      const mockDb = {
        forensicRuleConfig: {
          findUnique: vi.fn().mockImplementation(async ({ where }) => store.get(where.id) ?? null),
          upsert: vi.fn().mockImplementation(async ({ where, update, create }) => {
            const next = store.has(where.id)
              ? { ...store.get(where.id), ...update }
              : { id: where.id, ...create };
            store.set(where.id, next);
            return next;
          }),
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      const badges = createBadgesService({ database: mockDb, auditLogs: mockAudit });

      const proposal = await badges.proposeTierChange({
        tier: 'BRONZE',
        thresholdMinor: 200_000n,
        proposedByUserId: 'committee-a',
      });
      expect(proposal.tier).toBe('BRONZE');
      expect(proposal.status).toBe('PENDING_APPROVAL');

      await expect(
        badges.approveTierChange({ tier: 'BRONZE', approvedByUserId: 'committee-a' })
      ).rejects.toThrow(/second committee member/i);

      const approved = await badges.approveTierChange({
        tier: 'BRONZE',
        approvedByUserId: 'committee-b',
      });
      expect(approved.status).toBe('APPROVED');
      expect(approved.thresholdMinor).toBe('200000');

      const active = await badges.getActiveThresholds();
      expect(active.BRONZE).toBe(200_000n);
      expect(mockAudit.recordFromContext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complaints & Fraud Reports Service', () => {
    it('creates tracked fraud reports and complaints, scopes my complaints, and supports resolution', async () => {
      const records = new Map();
      const mockAudit = {
        recordFromContext: vi.fn().mockResolvedValue({ id: 'audit-cmp-1' }),
      };

      const repo = {
        async createCaseAlert(payload) {
          const id = records.size === 0 ? 'aaaaaaaa-1111-4111-8111-111111111111' : 'bbbbbbbb-2222-4222-8222-222222222222';
          const row = {
            id,
            ...payload,
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date(),
            events: [
              {
                id: 'ev-init',
                fromStatus: 'NONE',
                toStatus: 'OPEN',
                notes: JSON.stringify(payload.metadata),
                createdAt: new Date(),
              },
            ],
          };
          records.set(id, row);
          return row;
        },
        async listByRuleIds(ruleIds) {
          return Array.from(records.values()).filter((r) => ruleIds.includes(r.ruleId));
        },
        async findById(id) {
          return records.get(id) ?? null;
        },
        async updateStatusWithEvent(id, { fromStatus, status, notes }) {
          const row = records.get(id);
          row.status = status;
          row.events.push({
            id: 'ev-res',
            fromStatus,
            toStatus: status,
            notes,
            createdAt: new Date(),
          });
          return row;
        },
      };

      const service = createComplaintsService({ repository: repo, auditLogs: mockAudit });

      const fraud = await service.submitFraudReport({
        category: 'RECEIPT_ANOMALY',
        reference: 'MLK-TEST-1234',
        description: 'Duplicate receipt reported during physical audit review.',
      });
      expect(fraud.trackingRef).toBe('FRD-AAAAAAAA');
      expect(fraud.kind).toBe('FRAUD_REPORT');

      const complaint = await service.submitComplaint(
        {
          category: 'DISBURSEMENT_DELAY',
          subject: 'Tuition fee disbursement delayed',
          description: 'Approved disbursement has remained pending for 10 working days.',
        },
        { actorUserId: 'user-student-1' }
      );
      expect(complaint.trackingRef).toBe('CMP-BBBBBBBB');

      const mine = await service.listMine({
        user: { id: 'user-student-1' },
        permissions: ['complaint:create'],
      });
      expect(mine).toHaveLength(1);
      expect(mine[0].id).toBe(complaint.id);

      const resolved = await service.resolve(
        { user: { id: 'admin-1' }, permissions: ['complaint:manage'] },
        complaint.id,
        { status: 'RESOLVED', notes: 'Disbursement settled and verified.' }
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.events).toHaveLength(1);
    });
  });
});

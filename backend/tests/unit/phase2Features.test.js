'use strict';

import { describe, it, expect, vi } from 'vitest';
import { screenDonorName } from '../../src/security/nameScreening.js';
import { createDonorClaimService } from '../../src/modules/donors/donorClaim.service.js';
import { createBadgesService } from '../../src/modules/donors/badges.service.js';
import { createRecognitionWallService } from '../../src/modules/donors/recognitionWall.service.js';
import { alertsService } from '../../src/modules/alerts/alerts.service.js';
import { fraudSimulator } from '../../src/simulator/fraudSimulator.js';

describe('Phase 2 Features (G28 to G33)', () => {
  describe('G29: Donor Name Screening & Claim (FR-DON-03 to 06, FR-DON-11)', () => {
    it('rejects reserved terms, vulgarities in English and Swahili, and leetspeak lookalikes', () => {
      expect(screenDonorName('Admin').allowed).toBe(false);
      expect(screenDonorName('CharityChain').allowed).toBe(false);
      expect(screenDonorName('@dm1n').allowed).toBe(false);
      expect(screenDonorName('$cam').allowed).toBe(false);
      expect(screenDonorName('Mwizi').allowed).toBe(false);
      expect(screenDonorName('Matusi').allowed).toBe(false);
      expect(screenDonorName('Jane Doe').allowed).toBe(true);
      expect(screenDonorName('Amina Hassan').allowed).toBe(true);
    });

    it('claims a donation lot with matching donor identity and updates preferences', async () => {
      const donorRef = 'donor-ref-computed';
      const mockLot = {
        id: 'lot-1',
        receiptCode: 'MLK-ABCD-1234',
        donorRef,
        totalAmountMinor: 500000n,
        remainingAmountMinor: 500000n,
        currency: 'KES',
        allocations: []
      };

      const mockDb = {
        donationLot: {
          findUnique: vi.fn().mockResolvedValue(mockLot),
          findMany: vi.fn().mockResolvedValue([mockLot])
        },
        donorPreferenceEvent: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(({ data }) => ({ id: 'pref-1', ...data, createdAt: new Date() }))
        },
        donorBadgeAward: {
          findMany: vi.fn().mockResolvedValue([])
        },
        outboxEvent: {
          create: vi.fn().mockResolvedValue({ id: 'out-1' })
        }
      };

      const claimService = createDonorClaimService({ database: mockDb, secret: 'test-secret-that-is-at-least-32-bytes-long!' });
      // Stub computeDonorRef behavior if needed, or pass the actual hash computed from computeDonorRef
      const actualDonorRef = (await import('../../src/security/donorReference.js')).computeDonorRef('donor@example.com');
      mockLot.donorRef = actualDonorRef;

      const claim = await claimService.claimReceipt({
        receiptCode: 'MLK-ABCD-1234',
        donorIdentity: 'donor@example.com'
      });
      expect(claim.token).toBeDefined();

      const pref = await claimService.updatePreferences(claim.token, {
        displayMode: 'ALIAS',
        publicAlias: 'Generous Giver'
      });
      expect(pref.displayMode).toBe('ALIAS');
      expect(pref.publicAlias).toBe('Generous Giver');
    });
  });

  describe('G30: Badges & Tier Progression (FR-DON-07 to 10, R19, R20)', () => {
    it('correctly calculates Bronze, Silver, Gold, Patron, and Consistent Giver badges', async () => {
      const lots = [
        { totalAmountMinor: 600000n, createdAt: new Date('2025-09-01') },
        { totalAmountMinor: 400000n, createdAt: new Date('2025-10-01') },
        { totalAmountMinor: 100000n, createdAt: new Date('2025-11-01') }
      ];

      const mockDb = {
        forensicRuleConfig: { findUnique: vi.fn().mockResolvedValue(null) },
        donationLot: { findMany: vi.fn().mockResolvedValue(lots) },
        donorBadgeAward: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockImplementation(({ data }) => ({ id: `award-${data.tier}`, ...data }))
        },
        outboxEvent: { create: vi.fn().mockResolvedValue({ id: 'out-1' }) }
      };

      const badges = createBadgesService({ database: mockDb });
      const result = await badges.recomputeDonorBadges('donor-ref-1', '2025/2026');

      expect(result.qualifiedTiers).toContain('BRONZE');
      expect(result.qualifiedTiers).toContain('SILVER');
      expect(result.qualifiedTiers).toContain('CONSISTENT');
      expect(result.newAwardsCount).toBe(3);
    });
  });

  describe('G31: Recognition Wall and Moderation (FR-DON-12, 15, 16)', () => {
    it('enforces k-anonymity (>=5) before revealing anonymous donor count', async () => {
      const prefsWith4Anon = [
        { id: 'p1', donorRef: 'ref-1', displayMode: 'ANONYMOUS', isOptedIn: false, createdAt: new Date() },
        { id: 'p2', donorRef: 'ref-2', displayMode: 'ANONYMOUS', isOptedIn: false, createdAt: new Date() },
        { id: 'p3', donorRef: 'ref-3', displayMode: 'ANONYMOUS', isOptedIn: false, createdAt: new Date() },
        { id: 'p4', donorRef: 'ref-4', displayMode: 'ANONYMOUS', isOptedIn: false, createdAt: new Date() },
        { id: 'p5', donorRef: 'ref-5', displayMode: 'NAMED', confirmedName: 'Grace Hopper', isOptedIn: true, createdAt: new Date() }
      ];

      const mockDb = {
        donorPreferenceEvent: { findMany: vi.fn().mockResolvedValue(prefsWith4Anon) },
        donorBadgeAward: { findFirst: vi.fn().mockResolvedValue(null) }
      };

      const wallService = createRecognitionWallService({ database: mockDb });
      const wall = await wallService.getRecognitionWall();

      expect(wall.donors.length).toBe(1);
      expect(wall.donors[0].displayName).toBe('Grace Hopper');
      expect(wall.anonymousDonorsCount).toBeNull();
      expect(wall.anonymousThresholdMet).toBe(false);
    });

    it('reveals anonymous count when count is 5 or more', async () => {
      const prefsWith5Anon = Array.from({ length: 5 }, (_, i) => ({
        id: `p-${i}`,
        donorRef: `ref-${i}`,
        displayMode: 'ANONYMOUS',
        isOptedIn: false,
        createdAt: new Date()
      }));

      const mockDb = {
        donorPreferenceEvent: { findMany: vi.fn().mockResolvedValue(prefsWith5Anon) },
        donorBadgeAward: { findFirst: vi.fn().mockResolvedValue(null) }
      };

      const wallService = createRecognitionWallService({ database: mockDb });
      const wall = await wallService.getRecognitionWall();

      expect(wall.anonymousDonorsCount).toBe(5);
      expect(wall.anonymousThresholdMet).toBe(true);
    });
  });

  describe('G28: Benfords Law (FR-FOR-04, R14)', () => {
    it('detects anomalous disbursement distribution when chiSquare exceeds threshold', () => {
      const natural = [
        1200, 1500, 1800, 1900, 1050, 1340, 2100, 2500, 2900, 3100,
        3400, 4100, 4500, 5200, 5900, 6100, 7200, 8100, 9100, 1100,
        1400, 1600, 2200, 2700, 3200
      ];
      const resNormal = alertsService.checkBenfordsLaw(natural);
      expect(resNormal.isAnomalous).toBe(false);

      const manipulated = Array.from({ length: 30 }, () => 9500);
      const resManipulated = alertsService.checkBenfordsLaw(manipulated);
      expect(resManipulated.isAnomalous).toBe(true);
      expect(resManipulated.chiSquare).toBeGreaterThan(15.51);
    });
  });

  describe('G33: Fraud Simulator (Section 12.4)', () => {
    it('generates a year of activity and evaluates 10 labelled scenarios with high precision and recall', () => {
      const dataset = fraudSimulator.generateYearActivity({ baselineCount: 150 });
      expect(dataset.length).toBe(160);

      const evaluation = fraudSimulator.evaluateRuleEngine(dataset);
      expect(evaluation.totalRecords).toBe(160);

      for (const [rule, metrics] of Object.entries(evaluation.metrics)) {
        expect(metrics.tp).toBeGreaterThanOrEqual(1);
        expect(metrics.fp).toBe(0);
        expect(metrics.fn).toBe(0);
        expect(metrics.precision).toBe(1.0);
        expect(metrics.recall).toBe(1.0);
        expect(metrics.f1).toBe(1.0);
      }
    });
  });
});

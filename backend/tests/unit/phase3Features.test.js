'use strict';

import { describe, it, expect, vi } from 'vitest';
import { createAuditorService } from '../../src/modules/public/auditor.service.js';
import { createStablecoinService } from '../../src/modules/crypto/stablecoin.service.js';
import { createCertificateService } from '../../src/modules/public/certificate.service.js';
import { hashLeaf, computeMerkleRoot, generateMerkleProof } from '../../src/utils/merkle.js';

describe('Phase 3 Features (G34 to G37)', () => {
  describe('G34: Public Auditor API (FR-AUD-01, FR-AUD-04)', () => {
    it('exports paginated audit stream with hashes and sequences', async () => {
      const mockEvents = [
        { id: 'ev-1', sequence: 1, hash: 'h1', previousHash: '0x0', action: 'DONATION', entityType: 'LOT', entityId: 'l1', createdAt: new Date() },
        { id: 'ev-2', sequence: 2, hash: 'h2', previousHash: 'h1', action: 'DISBURSE', entityType: 'CASE', entityId: 'c1', createdAt: new Date() }
      ];

      const mockDb = {
        $transaction: vi.fn().mockResolvedValue([mockEvents, 2]),
        auditEvent: {
          findMany: vi.fn(),
          count: vi.fn()
        }
      };

      const auditor = createAuditorService({ database: mockDb });
      const stream = await auditor.exportAuditStream({ page: 1, pageSize: 10 });

      expect(stream.items.length).toBe(2);
      expect(stream.total).toBe(2);
      expect(stream.items[0].hash).toBe('h1');
      expect(stream.items[1].previousHash).toBe('h1');
    });
  });

  describe('G35: Testnet Stablecoin Channel', () => {
    it('provisions a verified KES lot from a USDC donation using conversion rate', async () => {
      let createdLot = null;
      let outboxEvent = null;

      const mockDb = {
        donationLot: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(({ data }) => {
            createdLot = { id: 'lot-crypto-1', ...data };
            return createdLot;
          })
        },
        outboxEvent: {
          create: vi.fn().mockImplementation(({ data }) => {
            outboxEvent = data;
            return { id: 'out-1', ...data };
          })
        }
      };

      const stablecoin = createStablecoinService({ database: mockDb });
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const donorWallet = '0x1234567890123456789012345678901234567890';

      // 10.00 USDC (10,000,000 units with 6 decimals) @ 130 KES/USD = 1,300 KES = 130,000 minor units
      const result = await stablecoin.recordStablecoinDonation({
        txHash,
        donorWallet,
        tokenSymbol: 'USDC',
        tokenAmountUnits: '10000000',
        tokenDecimals: 6,
        fxRateKes: 130.0
      });

      expect(result.amountMinor).toBe('130000');
      expect(createdLot.channel).toBe('CRYPTO');
      expect(createdLot.totalAmountMinor).toBe(130000n);
      expect(outboxEvent.eventName).toBe('donation.recorded');
      expect(outboxEvent.payload.txHash).toBe(txHash);
    });
  });

  describe('G36: Merkle Proof Verification & Chainlink Automation', () => {
    it('verifies valid Merkle proofs and rejects tampered proofs', () => {
      const leaves = ['doc-1', 'doc-2', 'doc-3', 'doc-4'].map(hashLeaf);
      const root = '0x' + computeMerkleRoot(leaves).toString('hex');
      const proof = generateMerkleProof(leaves, 1);

      const auditor = createAuditorService();
      const validCheck = auditor.verifyProof({
        leaf: leaves[1],
        proof,
        root
      });
      expect(validCheck.valid).toBe(true);

      const tamperedCheck = auditor.verifyProof({
        leaf: hashLeaf('doc-tampered'),
        proof,
        root
      });
      expect(tamperedCheck.valid).toBe(false);
    });

    it('returns upkeepNeeded when daily digest has not yet been anchored', async () => {
      const mockDb = {
        outboxEvent: { findFirst: vi.fn().mockResolvedValue(null) },
        donationLot: { findMany: vi.fn().mockResolvedValue([]) },
        lotAllocation: { findMany: vi.fn().mockResolvedValue([]) }
      };

      const auditor = createAuditorService({ database: mockDb });
      const check = await auditor.checkChainlinkAutomation();

      expect(check.upkeepNeeded).toBe(true);
      expect(check.performData).toMatch(/^0x01/);
    });
  });

  describe('G37: Donor Thank-You Certificate (FR-DON-14)', () => {
    it('generates verifiable SVG certificate with donor name, amount, and signature', async () => {
      const mockLot = {
        receiptCode: 'MLK-WXYZ-9876',
        donorRef: 'donor-ref-1',
        totalAmountMinor: 1500000n,
        currency: 'KES',
        sourceRefHash: '0xabc123',
        createdAt: new Date('2026-11-10T12:00:00Z'),
        allocations: [{ case: { caseNumber: 'C-1001' } }]
      };

      const mockDb = {
        donationLot: {
          findUnique: vi.fn().mockResolvedValue(mockLot)
        },
        donorPreferenceEvent: {
          findFirst: vi.fn().mockResolvedValue({
            isOptedIn: true,
            confirmedName: 'Amina Wangari'
          })
        }
      };

      const certService = createCertificateService({ database: mockDb });
      const cert = await certService.generateCertificate('MLK-WXYZ-9876');

      expect(cert.recipientName).toBe('Amina Wangari');
      expect(cert.amount).toBe('KES 15,000.00');
      expect(cert.signature).toMatch(/^[a-f0-9]{64}$/);
      expect(cert.svg).toContain('CHARITYCHAIN FOUNDATION');
      expect(cert.svg).toContain('MLK-WXYZ-9876');
      expect(cert.svg).toContain('Amina Wangari');
    });
  });
});


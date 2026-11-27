import { describe, it, expect, beforeEach } from 'vitest';
import { LotsService } from '../../src/modules/lots/lots.service.js';
import { ConflictError } from '../../src/errors/ConflictError.js';
import { prisma } from '@charitychain/database';
import { randomUUID } from 'node:crypto';

describe('G11 & G12: Lot Model, FIFO Allocation, and Pool-Drift Invariant (FR-FLOW-01, FR-FLOW-02, R16)', () => {
  let service;
  let testSubgroup;
  let testCase;

  beforeEach(async () => {
    service = new LotsService();

    testSubgroup = await prisma.subgroup.create({
      data: {
        code: `SG-LOTS-${Date.now()}`,
        name: 'FIFO Test Subgroup',
      },
    });

    testCase = await prisma.malkiaCase.create({
      data: {
        caseNumber: `C-FIFO-${Date.now()}`,
        subGroupId: testSubgroup.id,
        studentIdentifierHash: '0x' + '34'.repeat(32),
        needCategory: 'FEES',
        requestedAmountMinor: 100000n,
        justification: 'Tuition fees emergency',
        createdByUserId: randomUUID(),
      },
    });
  });

  it('allocates funds FIFO consuming oldest lots first', async () => {
    const earmark = `FEES_FIFO_${Date.now()}`;
    const lot1 = await prisma.donationLot.create({
      data: {
        receiptCode: `MLK-FIFO-1-${Date.now().toString().slice(-4)}`,
        sourceRefHash: '0x' + '01'.repeat(32),
        donorRef: '0x' + '99'.repeat(32),
        totalAmountMinor: 30000n, // KES 300
        remainingAmountMinor: 30000n,
        currency: 'KES',
        channel: 'MPESA',
        earmark,
        createdAt: new Date(Date.now() - 60000),
      },
    });

    const lot2 = await prisma.donationLot.create({
      data: {
        receiptCode: `MLK-FIFO-2-${Date.now().toString().slice(-4)}`,
        sourceRefHash: '0x' + '02'.repeat(32),
        donorRef: '0x' + '99'.repeat(32),
        totalAmountMinor: 50000n, // KES 500
        remainingAmountMinor: 50000n,
        currency: 'KES',
        channel: 'MPESA',
        earmark,
        createdAt: new Date(),
      },
    });

    const result = await service.allocateFundsFifo(testCase.id, 40000n, earmark);

    expect(result.allocatedMinor).toBe(40000n);
    expect(result.allocations).toHaveLength(2);

    const updatedLot1 = await prisma.donationLot.findUnique({ where: { id: lot1.id } });
    expect(updatedLot1.remainingAmountMinor).toBe(0n);
    expect(updatedLot1.isExhausted).toBe(true);

    const updatedLot2 = await prisma.donationLot.findUnique({ where: { id: lot2.id } });
    expect(updatedLot2.remainingAmountMinor).toBe(40000n);
    expect(updatedLot2.isExhausted).toBe(false);
  });

  it('rejects allocation when pool has insufficient funds', async () => {
    await expect(
      service.allocateFundsFifo(testCase.id, 9999999999n)
    ).rejects.toThrow(ConflictError);
  });

  it('G12: checkPoolDrift verifies that remaining lots equal inflow minus outflow', async () => {
    const report = await service.checkPoolDrift();
    expect(report.isBalanced).toBe(true);
    expect(report.driftMinor).toBe(0n);
  });
});

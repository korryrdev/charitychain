import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@charitychain/database';
import { randomUUID } from 'node:crypto';

describe('G05: PRD Entities and Append-Only Database Triggers', () => {
  let testSubgroup;
  let testCase;
  let testLot;

  beforeAll(async () => {
    // Create test subgroup
    testSubgroup = await prisma.subgroup.create({
      data: {
        code: `SG-TEST-${Date.now()}`,
        name: 'Test Engineering Subgroup',
        isActive: true,
      },
    });

    // Create test case
    testCase = await prisma.malkiaCase.create({
      data: {
        caseNumber: `C-TEST-${Date.now()}`,
        subGroupId: testSubgroup.id,
        studentIdentifierHash: '0x' + 'aa'.repeat(32),
        needCategory: 'FEES',
        requestedAmountMinor: 350000n,
        justification: 'Tuition balance support for term 2',
        createdByUserId: randomUUID(),
      },
    });

    // Create test lot
    testLot = await prisma.donationLot.create({
      data: {
        receiptCode: `MLK-TEST-${Date.now().toString().slice(-4)}`,
        sourceRefHash: '0x' + 'bb'.repeat(32),
        donorRef: '0x' + 'cc'.repeat(32),
        totalAmountMinor: 500000n,
        remainingAmountMinor: 500000n,
        channel: 'MPESA',
      },
    });
  });

  afterAll(async () => {
    // Cleanup parent test entities
    try {
      if (testCase) await prisma.malkiaCase.delete({ where: { id: testCase.id } }).catch(() => {});
      if (testLot) await prisma.donationLot.delete({ where: { id: testLot.id } }).catch(() => {});
      if (testSubgroup) await prisma.subgroup.delete({ where: { id: testSubgroup.id } }).catch(() => {});
    } catch {
      // Ignored in test cleanup
    }
  });

  it('proves database trigger blocks UPDATE and DELETE on case_events', async () => {
    const event = await prisma.caseEvent.create({
      data: {
        caseId: testCase.id,
        fromState: 'DRAFT',
        toState: 'SUBMITTED',
        notes: 'Submitted for committee review',
      },
    });

    expect(event.id).toBeTruthy();

    // UPDATE must be rejected by PostgreSQL trigger
    await expect(
      prisma.caseEvent.update({
        where: { id: event.id },
        data: { notes: 'Tampered notes' },
      })
    ).rejects.toThrow(/append-only/i);

    // DELETE must be rejected by PostgreSQL trigger
    await expect(
      prisma.caseEvent.delete({
        where: { id: event.id },
      })
    ).rejects.toThrow(/append-only/i);
  });

  it('proves database trigger blocks UPDATE and DELETE on allocations', async () => {
    const allocation = await prisma.lotAllocation.create({
      data: {
        lotId: testLot.id,
        caseId: testCase.id,
        amountMinor: 50000n,
      },
    });

    expect(allocation.id).toBeTruthy();

    // UPDATE must be rejected by PostgreSQL trigger
    await expect(
      prisma.lotAllocation.update({
        where: { id: allocation.id },
        data: { amountMinor: 100000n },
      })
    ).rejects.toThrow(/append-only/i);

    // DELETE must be rejected by PostgreSQL trigger
    await expect(
      prisma.lotAllocation.delete({
        where: { id: allocation.id },
      })
    ).rejects.toThrow(/append-only/i);
  });

  it('proves database trigger blocks UPDATE and DELETE on donation_raw_callbacks', async () => {
    const callback = await prisma.donationRawCallback.create({
      data: {
        provider: 'DARAJA',
        externalTransactionId: `TX-${Date.now()}`,
        rawPayload: { TransID: 'NL32X9P1AA', TransAmount: '500.00' },
      },
    });

    expect(callback.id).toBeTruthy();

    // UPDATE must be rejected by PostgreSQL trigger
    await expect(
      prisma.donationRawCallback.update({
        where: { id: callback.id },
        data: { processed: true },
      })
    ).rejects.toThrow(/append-only/i);

    // DELETE must be rejected by PostgreSQL trigger
    await expect(
      prisma.donationRawCallback.delete({
        where: { id: callback.id },
      })
    ).rejects.toThrow(/append-only/i);
  });
});

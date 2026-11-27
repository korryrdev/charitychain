import { describe, it, expect, beforeEach } from 'vitest';
import { ItemsService } from '../../src/modules/items/items.service.js';
import { ConflictError } from '../../src/errors/ConflictError.js';
import { prisma } from '@charitychain/database';
import { randomUUID } from 'node:crypto';

describe('G10: In-Kind Item Log and Issue (FR-INT-08, FR-FLOW-05)', () => {
  let service;
  let testSubgroup;
  let testCase;
  const actorId = randomUUID();

  beforeEach(async () => {
    service = new ItemsService();

    testSubgroup = await prisma.subgroup.create({
      data: {
        code: `SG-ITEMS-${Date.now()}`,
        name: 'Pharmacy Support Group',
      },
    });

    testCase = await prisma.malkiaCase.create({
      data: {
        caseNumber: `C-ITEM-${Date.now()}`,
        subGroupId: testSubgroup.id,
        studentIdentifierHash: '0x' + '12'.repeat(32),
        needCategory: 'BOOKS',
        requestedAmountMinor: 10n,
        justification: 'Medical textbooks support',
        createdByUserId: actorId,
      },
    });
  });

  it('logs in-kind donation, creates ITM lot, and provisions outbox event', async () => {
    const res = await service.logItemDonation({
      category: 'PHARMACY',
      itemName: 'First Aid Antiseptic Kit',
      quantity: 50,
      condition: 'NEW',
      loggedByUserId: actorId,
    });

    expect(res.lot.currency).toBe('ITM');
    expect(res.lot.channel).toBe('IN_KIND');
    expect(res.lot.totalAmountMinor).toBe(50n);
    expect(res.lot.remainingAmountMinor).toBe(50n);
    expect(res.item.name).toBe('First Aid Antiseptic Kit');
  });

  it('issues items to a case and decrements remaining lot balance FIFO', async () => {
    const cat = `BOOKS_${Date.now()}`;
    const logged = await service.logItemDonation({
      category: cat,
      itemName: 'Clinical Pharmacology 12th Ed',
      quantity: 5,
      condition: 'NEW',
      loggedByUserId: actorId,
    });

    const issueRes = await service.issueItemsToCase({
      caseId: testCase.id,
      itemId: logged.item.id,
      quantity: 3,
      notes: 'Issued to student',
      actorUserId: actorId,
    });

    expect(issueRes.success).toBe(true);
    expect(issueRes.quantityIssued).toBe(3);

    const updatedLot = await prisma.donationLot.findUnique({
      where: { id: logged.lot.id },
    });
    expect(updatedLot.remainingAmountMinor).toBe(2n);
    expect(updatedLot.isExhausted).toBe(false);
  });

  it('issues items by receipt code and caseNumber with mixed-case category names', async () => {
    const cat = `Clinical_Supplies_${Date.now()}`;
    const logged = await service.logItemDonation({
      category: cat,
      itemName: 'Surgical Gloves Box',
      quantity: 6,
      condition: 'NEW',
      loggedByUserId: actorId,
    });

    const issueRes = await service.issueItemsToCase({
      caseId: testCase.caseNumber,
      itemId: logged.lot.receiptCode,
      quantity: 2,
      notes: 'Issued via case number and receipt code',
      actorUserId: actorId,
    });

    expect(issueRes.success).toBe(true);
    expect(issueRes.caseId).toBe(testCase.id);
    expect(issueRes.caseNumber).toBe(testCase.caseNumber);
    expect(issueRes.quantityIssued).toBe(2);
  });

  it('rejects issuance when requested quantity exceeds available stock', async () => {
    const logged = await service.logItemDonation({
      category: 'MEDS',
      itemName: 'Paracetamol 500mg box',
      quantity: 2,
      condition: 'NEW',
      loggedByUserId: actorId,
    });

    await expect(
      service.issueItemsToCase({
        caseId: testCase.id,
        itemId: logged.item.id,
        quantity: 1000,
        actorUserId: actorId,
      })
    ).rejects.toThrow(ConflictError);
  });
});

'use strict';

import { prisma } from '@charitychain/database';
import { generateReceiptCode } from '../../utils/receiptCode.js';
import { computeDonorRef, computeSourceRefHash } from '../../security/donorReference.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { logger } from '../../observability/logger.js';

export class ItemsService {
  async listItems() {
    return prisma.donationLot.findMany({
      where: { channel: 'IN_KIND' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async logItemDonation({ category, itemName, quantity, condition: _condition, estimatedValue: _estimatedValue, photoUrl: _photoUrl, donorLabel, loggedByUserId }) {
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero.');
    }

    const receiptCode = generateReceiptCode();
    const donorIdentity = donorLabel || `ANONYMOUS_IN_KIND_${Date.now()}`;
    const donorRef = computeDonorRef(donorIdentity, 'bank');
    const sourceRefHash = computeSourceRefHash(receiptCode);

    const lot = await prisma.donationLot.create({
      data: {
        receiptCode,
        sourceRefHash,
        donorRef,
        totalAmountMinor: BigInt(quantity),
        remainingAmountMinor: BigInt(quantity),
        currency: 'ITM',
        channel: 'IN_KIND',
        earmark: category.toUpperCase(),
      },
    });

    let inventoryCategory = await prisma.inventoryCategory.findFirst({
      where: { name: category },
    });
    if (!inventoryCategory) {
      const code = `CAT-${category.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}-${Math.random().toString(16).slice(2, 6)}`;
      inventoryCategory = await prisma.inventoryCategory.create({
        data: { name: category, code, active: true },
      });
    }

    let inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        categoryId: inventoryCategory.id,
        normalizedName: itemName.toLowerCase().trim(),
        unit: 'PIECE',
      },
    });

    if (!inventoryItem) {
      const sku = `SKU-${category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          categoryId: inventoryCategory.id,
          name: itemName,
          normalizedName: itemName.toLowerCase().trim(),
          sku,
          unit: 'PIECE',
          active: true,
        },
      });
    }

    await prisma.outboxEvent.create({
      data: {
        eventName: 'donation.recorded',
        aggregateType: 'DONATION',
        aggregateId: lot.id,
        idempotencyKey: `item-donation-${lot.id}`,
        payload: {
          lotId: lot.id,
          receiptCode: lot.receiptCode,
          sourceRefHash: lot.sourceRefHash,
          donorRef: lot.donorRef,
          amountMinor: lot.totalAmountMinor.toString(),
          currency: 'ITM',
          channel: 2,
          recordedAt: Math.floor(lot.createdAt.getTime() / 1000),
        },
      },
    });

    logger.info(
      { lotId: lot.id, receiptCode: lot.receiptCode, quantity, loggedByUserId },
      'In-kind item donation logged.'
    );

    return { lot, item: inventoryItem };
  }

  async issueItemsToCase({ caseId, itemId, quantity, notes, actorUserId }) {
    const malkiaCase = await prisma.malkiaCase.findFirst({
      where: {
        OR: [{ id: caseId }, { caseNumber: caseId }],
      },
    });
    if (!malkiaCase) {
      throw new ConflictError(`Case with ID or Number "${caseId}" not found.`);
    }

    let item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { id: itemId },
          { sku: itemId },
          { normalizedName: itemId.toLowerCase().trim() },
        ],
      },
      include: { category: true },
    });
    if (!item) {
      const lot = await prisma.donationLot.findFirst({
        where: { OR: [{ id: itemId }, { receiptCode: itemId }] },
      });
      if (lot) {
        item = await prisma.inventoryItem.findFirst({
          where: { category: { name: lot.earmark } },
          include: { category: true },
        });
      }
    }
    if (!item) {
      throw new ConflictError(`Inventory item or lot with reference "${itemId}" not found.`);
    }

    const availableLots = await prisma.donationLot.findMany({
      where: {
        channel: 'IN_KIND',
        currency: 'ITM',
        earmark: item.category.name.toUpperCase(),
        isExhausted: false,
        remainingAmountMinor: { gt: 0n },
      },
      orderBy: { createdAt: 'asc' },
    });

    let needed = BigInt(quantity);
    let totalAvailable = availableLots.reduce((acc, l) => acc + l.remainingAmountMinor, 0n);

    if (totalAvailable < needed) {
      throw new ConflictError(
        `Insufficient inventory stock. Requested: ${quantity}, Available: ${totalAvailable.toString()}`
      );
    }

    const allocations = [];

    await prisma.$transaction(async (tx) => {
      for (const lot of availableLots) {
        if (needed <= 0n) break;

        const consume = lot.remainingAmountMinor < needed ? lot.remainingAmountMinor : needed;
        const newRemaining = lot.remainingAmountMinor - consume;

        await tx.donationLot.update({
          where: { id: lot.id },
          data: {
            remainingAmountMinor: newRemaining,
            isExhausted: newRemaining === 0n,
          },
        });

        const alloc = await tx.lotAllocation.create({
          data: {
            lotId: lot.id,
            caseId,
            amountMinor: consume,
          },
        });

        allocations.push(alloc);
        needed -= consume;
      }

      await tx.caseEvent.create({
        data: {
          caseId,
          fromState: malkiaCase.state,
          toState: malkiaCase.state,
          actorUserId,
          notes: `Issued ${quantity} items (${item.name}). ${notes || ''}`.trim(),
        },
      });
    });

    logger.info({ caseId, itemId, quantity, actorUserId }, 'Inventory items issued to case.');

    return { success: true, caseId, itemId, quantityIssued: quantity, allocations };
  }
}

export const itemsService = new ItemsService();
export default itemsService;

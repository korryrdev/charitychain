'use strict';

import { prisma } from '@charitychain/database';
import { ConflictError } from '../../errors/ConflictError.js';
import { logger } from '../../observability/logger.js';

export class LotsService {
  async allocateFundsFifo(caseId, amountMinor, earmark = null) {
    const required = BigInt(amountMinor);
    if (required <= 0n) {
      throw new ConflictError('Allocation amount must be greater than zero.');
    }

    const matchingLots = await prisma.donationLot.findMany({
      where: {
        currency: 'KES',
        isExhausted: false,
        remainingAmountMinor: { gt: 0n },
        ...(earmark ? { earmark } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    let generalLots = [];
    if (earmark) {
      generalLots = await prisma.donationLot.findMany({
        where: {
          currency: 'KES',
          isExhausted: false,
          remainingAmountMinor: { gt: 0n },
          earmark: null,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    const lotsToConsume = [...matchingLots, ...generalLots];
    const totalAvailable = lotsToConsume.reduce((sum, l) => sum + l.remainingAmountMinor, 0n);

    if (totalAvailable < required) {
      throw new ConflictError(
        `Insufficient pool balance. Required: ${required.toString()}, Available: ${totalAvailable.toString()}`
      );
    }

    let remainingNeeded = required;
    const allocations = [];

    await prisma.$transaction(async (tx) => {
      for (const lot of lotsToConsume) {
        if (remainingNeeded <= 0n) break;

        const consume = lot.remainingAmountMinor < remainingNeeded ? lot.remainingAmountMinor : remainingNeeded;
        const newRemaining = lot.remainingAmountMinor - consume;

        await tx.donationLot.update({
          where: { id: lot.id },
          data: {
            remainingAmountMinor: newRemaining,
            isExhausted: newRemaining === 0n,
          },
        });

        const allocation = await tx.lotAllocation.create({
          data: {
            lotId: lot.id,
            caseId,
            amountMinor: consume,
          },
        });

        allocations.push(allocation);
        remainingNeeded -= consume;
      }
    });

    logger.info(
      { caseId, amountMinor: amountMinor.toString(), allocationsCount: allocations.length },
      'FIFO lot allocation completed.'
    );

    return { allocatedMinor: required, allocations };
  }

  async checkPoolDrift() {
    const lots = await prisma.donationLot.findMany({
      where: { currency: 'KES' },
      select: { totalAmountMinor: true, remainingAmountMinor: true },
    });

    const totalInflow = lots.reduce((sum, l) => sum + l.totalAmountMinor, 0n);
    const totalRemaining = lots.reduce((sum, l) => sum + l.remainingAmountMinor, 0n);

    const allocations = await prisma.lotAllocation.findMany({
      where: { lot: { currency: 'KES' } },
      select: { amountMinor: true },
    });
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amountMinor, 0n);

    const expectedRemaining = totalInflow - totalAllocated;
    const driftMinor = totalRemaining - expectedRemaining;
    const isBalanced = driftMinor === 0n;

    if (!isBalanced) {
      logger.error(
        { totalInflow: totalInflow.toString(), totalAllocated: totalAllocated.toString(), totalRemaining: totalRemaining.toString(), driftMinor: driftMinor.toString() },
        'CRITICAL: Pool balance drift detected (Rule R16).'
      );

      await prisma.forensicAlert.create({
        data: {
          ruleId: 'R16',
          severity: 'CRITICAL',
          riskScore: 100,
          description: `Pool balance drift: remaining (${totalRemaining}) does not match inflow (${totalInflow}) minus outflow (${totalAllocated}). Drift: ${driftMinor}.`,
          entityType: 'LOT_POOL',
          status: 'OPEN',
        },
      });
    }

    return {
      isBalanced,
      totalInflow,
      totalAllocated,
      totalRemaining,
      driftMinor,
    };
  }
}

export const lotsService = new LotsService();
export default lotsService;

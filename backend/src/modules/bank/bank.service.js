'use strict';

import { prisma } from '@charitychain/database';
import { toMinorUnits } from '../../utils/money.js';
import { assertSegregation, assertState } from '../../utils/assertions.js';
import { computeDonorRef, computeSourceRefHash } from '../../security/donorReference.js';
import { generateReceiptCode } from '../../utils/receiptCode.js';
import { ConflictError } from '../../errors/ConflictError.js';

export class BankService {
  async createDeposit({
    depositReference,
    donorIdentity,
    amount,
    currency = 'KES',
    fxRate = null,
    consentVersion = 'v1.0',
    enteredByUserId,
  }) {
    const amountMinor = toMinorUnits(amount);
    const donorRef = computeDonorRef(donorIdentity);

    let convertedAmountMinor = null;
    if (currency !== 'KES' && fxRate) {
      convertedAmountMinor = BigInt(Math.round(Number(amountMinor) * Number(fxRate)));
    } else if (currency === 'KES') {
      convertedAmountMinor = amountMinor;
    }

    return prisma.bankDeposit.create({
      data: {
        depositReference,
        donorRef,
        amountMinor,
        currency,
        fxRate,
        convertedAmountMinor,
        consentVersion,
        status: 'PENDING_VERIFICATION',
        enteredByUserId,
      },
    });
  }

  async verifyDeposit(depositId, verifiedByUserId, earmark = null) {
    const deposit = await prisma.bankDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) {
      throw new ConflictError(`Bank deposit with ID "${depositId}" not found.`);
    }

    assertState(deposit.status, 'PENDING_VERIFICATION', 'Bank deposit');
    assertSegregation(
      verifiedByUserId,
      deposit.enteredByUserId,
      'Segregation of duties violation: Entrant cannot verify their own bank deposit.'
    );

    const receiptCode = generateReceiptCode();
    const sourceRefHash = computeSourceRefHash(deposit.depositReference);
    const lotAmountMinor = deposit.convertedAmountMinor ?? deposit.amountMinor;

    const [updatedDeposit, lot] = await prisma.$transaction([
      prisma.bankDeposit.update({
        where: { id: depositId },
        data: {
          status: 'VERIFIED',
          verifiedByUserId,
          verifiedAt: new Date(),
        },
      }),
      prisma.donationLot.create({
        data: {
          receiptCode,
          sourceRefHash,
          donorRef: deposit.donorRef,
          totalAmountMinor: lotAmountMinor,
          remainingAmountMinor: lotAmountMinor,
          currency: 'KES',
          channel: 'BANK',
          earmark: earmark || null,
        },
      }),
      prisma.outboxEvent.create({
        data: {
          eventName: 'donation.recorded',
          aggregateType: 'DonationLot',
          aggregateId: deposit.id,
          idempotencyKey: `outbox:bank-deposit-lot:${deposit.id}`,
          payload: {
            depositId: deposit.id,
            receiptCode,
            amountMinor: lotAmountMinor.toString(),
            originalCurrency: deposit.currency,
            originalAmountMinor: deposit.amountMinor.toString(),
            fxRate: deposit.fxRate ? deposit.fxRate.toString() : null,
            sourceRefHash,
            earmark: earmark || null,
          },
        },
      }),
    ]);

    return { deposit: updatedDeposit, lot };
  }

  async listDeposits(status = null) {
    const where = status ? { status } : {};
    return prisma.bankDeposit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const bankService = new BankService();

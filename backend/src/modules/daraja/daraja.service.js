'use strict';

import { prisma } from '@charitychain/database';
import { toMinorUnits } from '../../utils/money.js';
import { generateReceiptCode } from '../../utils/receiptCode.js';
import { computeDonorRef, computeSourceRefHash } from '../../security/donorReference.js';
import { integrationsConfig } from '../../config/integrations.js';
import { AuthorizationError } from '../../errors/AuthorizationError.js';
import { logger } from '../../observability/logger.js';

export class DarajaService {
  verifyToken(token) {
    const configuredToken =
      process.env.DARAJA_CALLBACK_TOKEN ||
      integrationsConfig.mpesa.callbackSecret ||
      'charitychain-daraja-c2b-secret-token';

    if (!token || token !== configuredToken) {
      throw new AuthorizationError('Invalid Daraja secret callback token.');
    }
  }

  async handleValidation(token, body) {
    this.verifyToken(token);
    logger.info({ transId: body?.TransID }, 'Daraja C2B validation received.');
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  async handleConfirmation(token, body) {
    this.verifyToken(token);

    const transId = body.TransID?.trim().toUpperCase();

    await prisma.donationRawCallback.create({
      data: {
        provider: 'DARAJA',
        externalTransactionId: transId,
        rawPayload: body,
      },
    });

    const existingLot = await prisma.donationLot.findFirst({
      where: { sourceRefHash: computeSourceRefHash(transId) },
    });

    if (existingLot) {
      logger.info({ transId, lotId: existingLot.id }, 'Daraja duplicate confirmation skipped.');
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    const amountMinor = toMinorUnits(body.TransAmount, 'KES');
    const donorPhone = body.MSISDN || 'UNKNOWN_MSISDN';
    const donorRef = computeDonorRef(donorPhone, 'phone');
    const sourceRefHash = computeSourceRefHash(transId);
    const receiptCode = generateReceiptCode();

    const billRef = body.BillRefNumber?.trim().toUpperCase();
    const earmark = ['FEES', 'UPKEEP', 'MEDICAL', 'EMERGENCY', 'BOOKS'].includes(billRef)
      ? billRef
      : null;

    const lot = await prisma.donationLot.create({
      data: {
        receiptCode,
        sourceRefHash,
        donorRef,
        totalAmountMinor: amountMinor,
        remainingAmountMinor: amountMinor,
        currency: 'KES',
        channel: 'MPESA',
        earmark,
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventName: 'donation.recorded',
        aggregateType: 'DONATION',
        aggregateId: lot.id,
        idempotencyKey: `donation-recorded-${lot.id}`,
        payload: {
          lotId: lot.id,
          receiptCode: lot.receiptCode,
          sourceRefHash: lot.sourceRefHash,
          donorRef: lot.donorRef,
          amountMinor: lot.totalAmountMinor.toString(),
          currency: lot.currency,
          channel: 0,
          recordedAt: Math.floor(lot.createdAt.getTime() / 1000),
        },
      },
    });

    logger.info(
      { transId, lotId: lot.id, receiptCode: lot.receiptCode, amountMinor: amountMinor.toString() },
      'Daraja donation lot created.'
    );

    return {
      ResultCode: 0,
      ResultDesc: 'Accepted',
      receiptCode: lot.receiptCode,
      lotId: lot.id,
    };
  }
}

export const darajaService = new DarajaService();
export default darajaService;

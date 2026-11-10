'use strict';

import { prisma } from '@charitychain/database';
import { computeDonorRef, computeSourceRefHash } from '../../security/donorReference.js';
import { generateReceiptCode } from '../../utils/receiptCode.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { ConflictError } from '../../errors/ConflictError.js';

export function createStablecoinService({ database = prisma } = {}) {
  return {
    async recordStablecoinDonation({
      txHash,
      donorWallet,
      tokenSymbol = 'USDC',
      tokenAmountUnits,
      tokenDecimals = 6,
      fxRateKes = 130.0,
      earmark = null
    }) {
      if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        throw new ValidationError('A valid 32-byte transaction hash is required.');
      }
      if (!donorWallet || !/^0x[a-fA-F0-9]{40}$/.test(donorWallet)) {
        throw new ValidationError('A valid Ethereum/Polygon wallet address is required.');
      }
      if (!tokenAmountUnits || BigInt(tokenAmountUnits) <= 0n) {
        throw new ValidationError('tokenAmountUnits must be positive.');
      }

      const sourceRefHash = computeSourceRefHash(txHash);
      const existing = await database.donationLot.findFirst({
        where: { sourceRefHash }
      });
      if (existing) {
        throw new ConflictError('A donation has already been recorded for this transaction hash.');
      }

      const unitsBigInt = BigInt(tokenAmountUnits);
      const divisor = 10n ** BigInt(tokenDecimals);
      const tokenMajor = Number(unitsBigInt) / Number(divisor);
      const kesMajor = tokenMajor * fxRateKes;
      const amountMinor = BigInt(Math.round(kesMajor * 100));

      const receiptCode = generateReceiptCode();
      const donorRef = computeDonorRef(donorWallet);

      const lot = await database.donationLot.create({
        data: {
          receiptCode,
          sourceRefHash,
          donorRef,
          totalAmountMinor: amountMinor,
          remainingAmountMinor: amountMinor,
          currency: 'KES',
          channel: 'CRYPTO',
          earmark: earmark || null
        }
      });

      await database.outboxEvent.create({
        data: {
          eventName: 'donation.recorded',
          aggregateType: 'DonationLot',
          aggregateId: lot.id,
          idempotencyKey: `outbox:crypto:${txHash}`,
          payload: {
            lotId: lot.id,
            receiptCode,
            amountMinor: amountMinor.toString(),
            originalToken: tokenSymbol,
            tokenAmountUnits: unitsBigInt.toString(),
            fxRateKes: fxRateKes.toString(),
            donorWallet,
            txHash,
            sourceRefHash,
            earmark: earmark || null
          }
        }
      });

      return {
        lotId: lot.id,
        receiptCode,
        amountMinor: amountMinor.toString(),
        currency: 'KES',
        tokenSymbol,
        tokenAmount: tokenMajor,
        fxRateKes,
        txHash
      };
    }
  };
}

export const stablecoinService = createStablecoinService();


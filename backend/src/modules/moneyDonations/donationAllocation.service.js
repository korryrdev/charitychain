import { Prisma } from '@prisma/client';
import { ConflictError } from '../../errors/ConflictError.js';
import { DonationStateError } from './moneyDonations.errors.js';
import { moneyDonationsRepository } from './moneyDonations.repository.js';

export function createDonationAllocationService(repository = moneyDonationsRepository) {
  return {
    async allocate(donation, { allocationType, targetReference, amount }) {
      if (!['CONFIRMED', 'RECONCILED'].includes(donation.status)) {
        throw new DonationStateError('Only confirmed funds can be allocated.');
      }
      const allocationAmount = new Prisma.Decimal(amount);
      if (!allocationAmount.isPositive()) throw new ConflictError('Allocation amount must be positive.');
      const existing = await repository.findAllocation(
        donation.id,
        allocationType,
        targetReference
      );
      if (existing) {
        if (!new Prisma.Decimal(existing.amount).equals(allocationAmount)) {
          throw new ConflictError('This allocation target already has a different amount.');
        }
        return existing;
      }
      const aggregate = await repository.allocationTotal(donation.id);
      const allocated = aggregate._sum.amount ?? new Prisma.Decimal(0);
      if (allocated.plus(allocationAmount).greaterThan(donation.amount)) {
        throw new ConflictError('Allocation exceeds the confirmed donation amount.');
      }
      try {
        return await repository.createAllocation({
          donationId: donation.id,
          allocationType,
          targetReference,
          amount: allocationAmount
        });
      } catch (error) {
        if (error.code !== 'P2002') throw error;
        const concurrent = await repository.findAllocation(
          donation.id,
          allocationType,
          targetReference
        );
        if (!concurrent || !new Prisma.Decimal(concurrent.amount).equals(allocationAmount)) {
          throw new ConflictError('Allocation conflict. Please retry.');
        }
        return concurrent;
      }
    }
  };
}

export const donationAllocationService = createDonationAllocationService();

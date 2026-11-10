import { prisma } from '@charitychain/database';
import { DonationStateError } from './moneyDonations.errors.js';

const includeDetails = {
  donorProfile: true,
  allocations: { orderBy: { createdAt: 'asc' } },
  receipt: true
};

export function createMoneyDonationsRepository(database = prisma) {
  return {
    findDonorProfile(userId) {
      return database.donorProfile.findUnique({ where: { userId } });
    },
    create(data) {
      return database.moneyDonation.create({ data, include: includeDetails });
    },
    findById(id) {
      return database.moneyDonation.findUnique({ where: { id }, include: includeDetails });
    },
    findByTrackingId(trackingId) {
      return database.moneyDonation.findUnique({ where: { trackingId }, include: includeDetails });
    },
    findByIdempotency(donorProfileId, idempotencyKey) {
      return database.moneyDonation.findUnique({
        where: { donorProfileId_idempotencyKey: { donorProfileId, idempotencyKey } },
        include: includeDetails
      });
    },
    async listForDonor(donorProfileId, { page, pageSize, status }) {
      const where = { donorProfileId, ...(status ? { status } : {}) };
      const [items, total] = await database.$transaction([
        database.moneyDonation.findMany({
          where,
          include: includeDetails,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        database.moneyDonation.count({ where })
      ]);
      return { items, total, page, pageSize };
    },
    async transition(id, currentStatus, nextStatus, data = {}) {
      const result = await database.moneyDonation.updateMany({
        where: { id, status: currentStatus },
        data: { ...data, status: nextStatus }
      });
      if (result.count !== 1) throw new DonationStateError('Donation state changed concurrently.');
      return database.moneyDonation.findUniqueOrThrow({ where: { id }, include: includeDetails });
    },
    createAllocation(data) {
      return database.donationAllocation.create({ data });
    },
    findAllocation(donationId, allocationType, targetReference) {
      return database.donationAllocation.findFirst({
        where: { donationId, allocationType, targetReference }
      });
    },
    reverseAllocations(donationId) {
      return database.donationAllocation.updateMany({
        where: { donationId, status: { not: 'REVERSED' } },
        data: { status: 'REVERSED' }
      });
    },
    allocationTotal(donationId) {
      return database.donationAllocation.aggregate({
        where: { donationId, status: { not: 'REVERSED' } },
        _sum: { amount: true }
      });
    },
    createReceipt(data) {
      return database.donationReceipt.upsert({
        where: { donationId: data.donationId },
        update: {},
        create: data
      });
    },
    voidReceipt(donationId, voidedAt = new Date()) {
      return database.donationReceipt.updateMany({ where: { donationId }, data: { voidedAt } });
    }
  };
}

export const moneyDonationsRepository = createMoneyDonationsRepository();

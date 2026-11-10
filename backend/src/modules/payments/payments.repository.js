import { prisma } from '@charitychain/database';

const attemptInclude = { donation: { include: { donorProfile: true } }, providerEvents: true };

export function createPaymentsRepository(database = prisma) {
  return {
    findDonation: (id) => database.moneyDonation.findUnique({ where: { id }, include: { donorProfile: true, paymentAttempts: true } }),
    findDonationByTrackingId: (trackingId) => database.moneyDonation.findUnique({ where: { trackingId }, include: { donorProfile: true, paymentAttempts: true } }),
    createAttempt: (data) => database.paymentAttempt.create({ data, include: attemptInclude }),
    findAttempt: (id) => database.paymentAttempt.findUnique({ where: { id }, include: attemptInclude }),
    findAttemptByIdempotency: (donationId, idempotencyKey) => database.paymentAttempt.findUnique({ where: { donationId_idempotencyKey: { donationId, idempotencyKey } }, include: attemptInclude }),
    findAttemptByProviderRequest: (providerRequestId) => database.paymentAttempt.findUnique({ where: { providerRequestId }, include: attemptInclude }),
    async transitionAttempt(id, currentStatuses, status, data = {}) {
      const updated = await database.paymentAttempt.updateMany({ where: { id, status: { in: currentStatuses } }, data: { ...data, status } });
      if (!updated.count) return database.paymentAttempt.findUnique({ where: { id }, include: attemptInclude });
      return database.paymentAttempt.findUniqueOrThrow({ where: { id }, include: attemptInclude });
    },
    listForDonation: (donationId) => database.paymentAttempt.findMany({ where: { donationId }, include: attemptInclude, orderBy: { createdAt: 'desc' } }),
    createProviderEvent: (data) => database.paymentProviderEvent.create({ data }),
    findProviderEvent: (provider, providerEventId) => database.paymentProviderEvent.findUnique({ where: { provider_providerEventId: { provider, providerEventId } } }),
    completeProviderEvent: (id, data) => database.paymentProviderEvent.update({ where: { id }, data: { ...data, processingStatus: 'PROCESSED', processedAt: new Date() } }),
    rejectProviderEvent: (id, resultCode, resultMessage) => database.paymentProviderEvent.update({ where: { id }, data: { processingStatus: 'REJECTED', resultCode, resultMessage, processedAt: new Date() } })
  };
}

export const paymentsRepository = createPaymentsRepository();

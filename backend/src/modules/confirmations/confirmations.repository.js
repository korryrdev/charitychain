import { prisma } from '@charitychain/database';
const include = { response: true, deliveries: { orderBy: { createdAt: 'asc' } }, physicalDonation: true };
export function createConfirmationsRepository(database = prisma) { return {
  async supersedeAndCreate(data) { return database.$transaction(async (transaction) => { await transaction.confirmationRequest.updateMany({ where: { targetType: data.targetType, targetId: data.targetId, status: { in: ['PENDING','PROCESSING'] } }, data: { status: 'SUPERSEDED', completedAt: new Date() } }); return transaction.confirmationRequest.create({ data, include }); }); },
  findById(id) { return database.confirmationRequest.findUnique({ where: { id }, include }); },
  findByTokenHash(tokenHash) { return database.confirmationRequest.findUnique({ where: { tokenHash }, include }); },
  async claim(id, now = new Date()) { const result = await database.confirmationRequest.updateMany({ where: { id, status: 'PENDING', expiresAt: { gt: now } }, data: { status: 'PROCESSING', claimedAt: now } }); if (!result.count) return null; return database.confirmationRequest.findUniqueOrThrow({ where: { id }, include }); },
  release(id) { return database.confirmationRequest.updateMany({ where: { id, status: 'PROCESSING' }, data: { status: 'PENDING', claimedAt: null } }); },
  complete(id, decision, metadata) { return database.$transaction(async (transaction) => { await transaction.confirmationResponse.create({ data: { confirmationRequestId: id, decision, ...metadata } }); return transaction.confirmationRequest.update({ where: { id }, data: { status: decision === 'YES' ? 'ACCEPTED' : 'REJECTED', completedAt: new Date() }, include }); }); },
  expire(id) { return database.confirmationRequest.updateMany({ where: { id, status: { in: ['PENDING','PROCESSING'] } }, data: { status: 'EXPIRED', completedAt: new Date() } }); },
  expireDue(now) { return database.confirmationRequest.updateMany({ where: { status: 'PENDING', expiresAt: { lte: now } }, data: { status: 'EXPIRED', completedAt: now } }); },
  createDelivery(data) { return database.confirmationDelivery.create({ data }); },
  markDeliverySent(id, providerMessageId) { return database.confirmationDelivery.update({ where: { id }, data: { status: 'SENT', providerMessageId, sentAt: new Date() } }); },
  markDeliveryFailed(id, failureReason) { return database.confirmationDelivery.update({ where: { id }, data: { status: 'FAILED', failureReason } }); },
  updateDeliveryStatus(providerMessageId, status, failureReason) { return database.confirmationDelivery.update({ where: { providerMessageId }, data: { status, failureReason, deliveredAt: status === 'DELIVERED' ? new Date() : undefined } }); },
  markRequestSent(id) { return database.confirmationRequest.update({ where: { id }, data: { sentAt: new Date() }, include }); },
  markRequestDeliveryFailed(id) { return database.confirmationRequest.update({ where: { id }, data: { status: 'DELIVERY_FAILED', completedAt: new Date() }, include }); }
}; }
export const confirmationsRepository = createConfirmationsRepository();

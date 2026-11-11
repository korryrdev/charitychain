'use strict';

import { prisma } from '@charitychain/database';
const include = { deliveries: { orderBy: { sequence: 'asc' } } };
export function createNotificationsRepository(database = prisma) { return {
  create(data) { return database.notification.create({ data, include }); },
  find(id) { return database.notification.findUnique({ where: { id }, include }); },
  findByIdempotency(recipientAddressHash, idempotencyKey) { return database.notification.findUnique({ where: { recipientAddressHash_idempotencyKey: { recipientAddressHash, idempotencyKey } }, include }); },
  listForUser(recipientUserId) { return database.notification.findMany({ where: { recipientUserId }, include, orderBy: { createdAt: 'desc' } }); },
  async beginDelivery(notificationId) { return database.$transaction(async (tx) => { const notification = await tx.notification.findUniqueOrThrow({ where: { id: notificationId } }); if (notification.attemptCount >= notification.maximumAttempts) return null; const sequence = notification.attemptCount + 1; const delivery = await tx.notificationDelivery.create({ data: { notificationId, sequence, status: 'QUEUED' } }); await tx.notification.update({ where: { id: notificationId }, data: { attemptCount: sequence, status: 'QUEUED', lastError: null } }); return { notification, delivery }; }); },
  delivered(notificationId, deliveryId, result) { return database.$transaction(async (tx) => { await tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'DELIVERED', provider: result.provider ?? null, providerMessageId: result.providerMessageId ?? null, completedAt: new Date() } }); return tx.notification.update({ where: { id: notificationId }, data: { status: 'DELIVERED', sentAt: new Date(), deliveredAt: new Date(), lastError: null }, include }); }); },
  failed(notificationId, deliveryId, message) { return database.$transaction(async (tx) => { await tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'FAILED', errorMessage: message.slice(0, 1000), completedAt: new Date() } }); return tx.notification.update({ where: { id: notificationId }, data: { status: 'FAILED', failedAt: new Date(), lastError: message.slice(0, 1000) }, include }); }); }
}; }
export const notificationsRepository = createNotificationsRepository();

'use strict';

import { createHash } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { createNotificationDeliveryService } from './notificationDelivery.service.js';
import { assertCanManageNotifications, assertCanReadNotification } from './notifications.policy.js';
import { notificationsRepository } from './notifications.repository.js';
import { notificationTemplateService } from './notificationTemplate.service.js';

const addressHash = (address) => createHash('sha256').update(address.trim().toLowerCase()).digest('hex');
const map = (notification) => ({ id: notification.id, recipientUserId: notification.recipientUserId, recipientAddressLast4: notification.recipientAddressLast4, channel: notification.channel, templateCode: notification.templateCode, title: notification.title, body: notification.body, status: notification.status, attemptCount: notification.attemptCount, maximumAttempts: notification.maximumAttempts, lastError: notification.lastError, sentAt: notification.sentAt, deliveredAt: notification.deliveredAt, failedAt: notification.failedAt, createdAt: notification.createdAt, deliveries: notification.deliveries?.map(({ sequence, status, provider, providerMessageId, errorMessage, attemptedAt, completedAt }) => ({ sequence, status, provider, providerMessageId, errorMessage, attemptedAt, completedAt })) ?? [] });
function conflict(message) { return new AppError({ message, code: ERROR_CODES.CONFLICT, statusCode: 409 }); }

export function createNotificationsService({ repository = notificationsRepository, template = notificationTemplateService, delivery = createNotificationDeliveryService({ repository }) } = {}) { return {
  async create(auth, input) { assertCanManageNotifications(auth); const hash = addressHash(input.recipientAddress); const existing = await repository.findByIdempotency(hash, input.idempotencyKey); if (existing) return map(existing); const message = template.render(input.templateCode, input.variables); const notification = await repository.create({ recipientUserId: input.recipientUserId ?? null, recipientAddressHash: hash, recipientAddressLast4: input.recipientAddress.slice(-4), channel: input.channel, templateCode: input.templateCode, ...message, idempotencyKey: input.idempotencyKey, maximumAttempts: input.maximumAttempts }); try { return map(await delivery.dispatch(notification, input.recipientAddress)); } catch { return map(await repository.find(notification.id)); } },
  async mine(auth) { return (await repository.listForUser(auth.user.id)).map(map); },
  async retry(auth, id, recipientAddress) { assertCanManageNotifications(auth); const notification = await repository.find(id); if (!notification) throw new AppError({ message: 'Notification not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); if (notification.recipientAddressHash !== addressHash(recipientAddress)) throw conflict('Recipient address does not match the notification record.'); if (notification.status === 'DELIVERED') return map(notification); try { return map(await delivery.dispatch(notification, recipientAddress)); } catch { return map(await repository.find(id)); } },
  async get(auth, id) { const notification = await repository.find(id); if (!notification) throw new AppError({ message: 'Notification not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); assertCanReadNotification(auth, notification); return map(notification); }
}; }
export const notificationsService = createNotificationsService();

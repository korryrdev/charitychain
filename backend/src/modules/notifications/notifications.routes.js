'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { notificationsController } from './notifications.controller.js';
import { createNotificationSchema, notificationParamsSchema, retryNotificationSchema } from './notifications.validation.js';
export function createNotificationsRouter(controller = notificationsController) { const router = Router(); router.post('/', validateRequest({ body: createNotificationSchema }), controller.create); router.get('/mine', controller.mine); router.get('/:notificationId', validateRequest({ params: notificationParamsSchema }), controller.get); router.post('/:notificationId/retry', validateRequest({ params: notificationParamsSchema, body: retryNotificationSchema }), controller.retry); return router; }
export const notificationsRouter = createNotificationsRouter();

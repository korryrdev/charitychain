'use strict';

import { notificationsService } from './notifications.service.js';
export function createNotificationsController(service = notificationsService) { const handle = (operation) => async (req, res, next) => { try { await operation(req, res); } catch (error) { next(error); } }; return { create: handle(async (req, res) => res.status(201).json({ notification: await service.create(req.auth, req.body) })), mine: handle(async (req, res) => res.json({ notifications: await service.mine(req.auth) })), get: handle(async (req, res) => res.json({ notification: await service.get(req.auth, req.params.notificationId) })), retry: handle(async (req, res) => res.json({ notification: await service.retry(req.auth, req.params.notificationId, req.body.recipientAddress) })) }; }
export const notificationsController = createNotificationsController();

'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { disbursementsController } from './disbursements.controller.js';
import { callbackSchema, createDisbursementSchema, disbursementApplicationParamsSchema, disbursementParamsSchema } from './disbursements.validation.js';
export function createDisbursementsRouter(controller = disbursementsController) { const router = Router(); router.post('/applications/:applicationId', validateRequest({ params: disbursementApplicationParamsSchema, body: createDisbursementSchema }), controller.create); router.get('/applications/:applicationId', validateRequest({ params: disbursementApplicationParamsSchema }), controller.getForApplication); router.get('/:disbursementId', validateRequest({ params: disbursementParamsSchema }), controller.get); router.post('/:disbursementId/retry', validateRequest({ params: disbursementParamsSchema }), controller.retry); return router; }
export function createDisbursementsWebhookRouter(controller = disbursementsController) { const router = Router(); router.post('/mpesa', validateRequest({ body: callbackSchema }), controller.callback); router.post('/mpesa/timeout', validateRequest({ body: callbackSchema }), controller.callback); return router; }
export const disbursementsRouter = createDisbursementsRouter();
export const disbursementsWebhookRouter = createDisbursementsWebhookRouter();

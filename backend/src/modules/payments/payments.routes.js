import { Router } from 'express';
import { idempotency } from '../../middleware/idempotency.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { paymentsController } from './payments.controller.js';
import { donationPaymentParamsSchema, initiatePaymentSchema, paymentIdParamsSchema, providerWebhookParamsSchema, providerWebhookSchema } from './payments.validation.js';

export function createPaymentsRouter(controller = paymentsController) { const router = Router(); router.post('/', validateRequest({ body: initiatePaymentSchema }), idempotency, controller.initiate); router.get('/:paymentId', validateRequest({ params: paymentIdParamsSchema }), controller.get); router.get('/donation/:donationId/history', validateRequest({ params: donationPaymentParamsSchema }), controller.listForDonation); return router; }
export function createPaymentsWebhookRouter(controller = paymentsController) { const router = Router(); router.post('/:provider', validateRequest({ params: providerWebhookParamsSchema, body: providerWebhookSchema }), controller.webhook); return router; }
export const paymentsRouter = createPaymentsRouter();
export const paymentsWebhookRouter = createPaymentsWebhookRouter();

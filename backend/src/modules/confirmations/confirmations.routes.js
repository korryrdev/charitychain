import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { confirmationsController } from './confirmations.controller.js';
import { confirmationIdParamsSchema, confirmationResponseSchema, physicalConfirmationParamsSchema } from './confirmations.validation.js';
export function createConfirmationsRouter(controller = confirmationsController) { const router = Router(); router.use(authorize(PERMISSIONS.CONFIRMATION_MANAGE)); router.post('/physical-donations/:donationId', validateRequest({ params: physicalConfirmationParamsSchema }), controller.issuePhysical); router.get('/:confirmationId', validateRequest({ params: confirmationIdParamsSchema }), controller.get); return router; }
export function createPublicConfirmationsRouter(controller = confirmationsController) { const router = Router(); router.post('/respond', validateRequest({ body: confirmationResponseSchema }), controller.respond); return router; }
export const confirmationsRouter = createConfirmationsRouter();
export const publicConfirmationsRouter = createPublicConfirmationsRouter();

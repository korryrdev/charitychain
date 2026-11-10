import { Router } from 'express';
import { idempotency } from '../../middleware/idempotency.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { moneyDonationsController } from './moneyDonations.controller.js';
import {
  createMoneyDonationSchema,
  donationIdParamsSchema,
  donationListQuerySchema,
  trackingLookupSchema
} from './moneyDonations.validation.js';

export function createMoneyDonationsRouter(controller = moneyDonationsController) {
  const router = Router();
  router.post('/', validateRequest({ body: createMoneyDonationSchema }), idempotency, controller.create);
  router.get('/', validateRequest({ query: donationListQuerySchema }), controller.listMine);
  router.get('/:donationId', validateRequest({ params: donationIdParamsSchema }), controller.get);
  return router;
}

export function createPublicMoneyDonationsRouter(controller = moneyDonationsController) {
  const router = Router();
  router.post('/track', validateRequest({ body: trackingLookupSchema }), controller.track);
  return router;
}

export const moneyDonationsRouter = createMoneyDonationsRouter();
export const publicMoneyDonationsRouter = createPublicMoneyDonationsRouter();

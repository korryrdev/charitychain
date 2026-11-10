'use strict';

import { Router } from 'express';
import { itemsService } from './items.service.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createItemDonationSchema, issueInventorySchema } from './items.validation.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';

export function createItemsRouter(service = itemsService) {
  const router = Router();

  router.post(
    '/',
    authorize(PERMISSIONS.ITEM_LOG_CREATE),
    validateRequest({ body: createItemDonationSchema }),
    async (req, res, next) => {
      try {
        const result = await service.logItemDonation({
          ...req.body,
          loggedByUserId: req.auth.user.id,
        });
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/issue',
    authorize(PERMISSIONS.ITEM_ISSUE),
    validateRequest({ body: issueInventorySchema }),
    async (req, res, next) => {
      try {
        const result = await service.issueItemsToCase({
          ...req.body,
          actorUserId: req.auth.user.id,
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export const itemsRouter = createItemsRouter();
export default itemsRouter;

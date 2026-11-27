'use strict';

import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { donorPortalService } from './donorPortal.service.js';

export function createDonorPortalRouter(service = donorPortalService) {
  const router = Router();

  // GET /api/v1/donor/dashboard
  router.get(
    '/dashboard',
    authorize(PERMISSIONS.DONATION_READ_SELF),
    async (req, res, next) => {
      try {
        const data = await service.getDashboard(req.auth.user.id);
        res.status(200).json(data);
      } catch (err) {
        next(err);
      }
    }
  );

  // POST /api/v1/donor/claim
  router.post(
    '/claim',
    authorize(PERMISSIONS.DONATION_READ_SELF),
    async (req, res, next) => {
      try {
        const { receiptCode, donorIdentity } = req.body || {};
        const result = await service.claimReceipt(req.auth.user.id, receiptCode, donorIdentity);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  // PATCH /api/v1/donor/settings
  router.patch(
    '/settings',
    authorize(PERMISSIONS.DONATION_READ_SELF),
    async (req, res, next) => {
      try {
        const result = await service.updateSettings(req.auth.user.id, req.body || {});
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export const donorPortalRouter = createDonorPortalRouter();
export default donorPortalRouter;


'use strict';

import { Router } from 'express';
import { donorPortalService } from './donorPortal.service.js';

export function createDonorPortalRouter(service = donorPortalService) {
  const router = Router();

  // GET /api/v1/donor/dashboard
  router.get('/dashboard', async (req, res, next) => {
    try {
      const data = await service.getDashboard(req.auth.user.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/donor/claim
  router.post('/claim', async (req, res, next) => {
    try {
      const { receiptCode } = req.body || {};
      const result = await service.claimReceipt(req.auth.user.id, receiptCode);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/donor/settings
  router.patch('/settings', async (req, res, next) => {
    try {
      const result = await service.updateSettings(req.auth.user.id, req.body || {});
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const donorPortalRouter = createDonorPortalRouter();
export default donorPortalRouter;


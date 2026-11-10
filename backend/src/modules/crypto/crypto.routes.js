'use strict';

import { Router } from 'express';
import { stablecoinService } from './stablecoin.service.js';

export function createCryptoRouter(service = stablecoinService) {
  const router = Router();

  router.post('/stablecoin', async (req, res, next) => {
    try {
      const result = await service.recordStablecoinDonation(req.body);
      res.status(201).json({ donation: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const cryptoRouter = createCryptoRouter();
export default cryptoRouter;


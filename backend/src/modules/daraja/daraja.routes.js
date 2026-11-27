'use strict';

import { Router } from 'express';
import { darajaService } from './daraja.service.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { darajaC2bPayloadSchema } from './daraja.validation.js';

export function createDarajaRouter(service = darajaService) {
  const router = Router();

  router.post(
    '/c2b/validation/:token',
    validateRequest({ body: darajaC2bPayloadSchema }),
    async (req, res, next) => {
      try {
        const result = await service.handleValidation(req.params.token, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/c2b/confirmation/:token',
    validateRequest({ body: darajaC2bPayloadSchema }),
    async (req, res, next) => {
      try {
        const result = await service.handleConfirmation(req.params.token, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export const darajaRouter = createDarajaRouter();
export default darajaRouter;


import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { paymentsService } from '../../modules/payments/payments.service.js';
import { createMpesaCallbackController } from './callback.controller.js';
import { stkCallbackSchema } from './callback.validation.js';

export function createMpesaCallbacksRouter(service = paymentsService) {
  const router = Router();
  const controller = createMpesaCallbackController({
    onEvent: (event) => service.processMpesaCallback(event)
  });
  router.post('/stk', validateRequest({ body: stkCallbackSchema }), controller.stk);
  return router;
}

export const mpesaCallbacksRouter = createMpesaCallbacksRouter();

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { recognitionController } from './recognition.controller.js';
import { recognitionHistoryQuerySchema } from './recognition.validation.js';

export function createRecognitionRouter(controller = recognitionController) {
  const router = Router();
  router.get('/me', controller.mine);
  router.get(
    '/me/history',
    validateRequest({ query: recognitionHistoryQuerySchema }),
    controller.history
  );
  return router;
}

export function createPublicRecognitionRouter(controller = recognitionController) {
  const router = Router();
  router.get('/tiers', controller.tiers);
  return router;
}

export const recognitionRouter = createRecognitionRouter();
export const publicRecognitionRouter = createPublicRecognitionRouter();

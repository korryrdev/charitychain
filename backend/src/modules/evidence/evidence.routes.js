'use strict';

import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { evidenceController } from './evidence.controller.js';
import { createEvidenceSchema, evidenceParamsSchema, evidenceSubjectParamsSchema } from './evidence.validation.js';

export function createEvidenceRouter(controller = evidenceController) {
  const router = Router();
  router.post('/', validateRequest({ body: createEvidenceSchema }), controller.create);
  router.post('/retention/expire', controller.expireDue);
  router.get('/subjects/:subjectType/:subjectId', validateRequest({ params: evidenceSubjectParamsSchema }), controller.list);
  router.get('/:evidenceId', validateRequest({ params: evidenceParamsSchema }), controller.get);
  router.post('/:evidenceId/verify', validateRequest({ params: evidenceParamsSchema }), controller.verify);
  router.delete('/:evidenceId/content', validateRequest({ params: evidenceParamsSchema }), controller.destroy);
  return router;
}

export const evidenceRouter = createEvidenceRouter();

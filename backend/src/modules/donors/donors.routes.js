import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { requireMfa } from '../../middleware/requireMfa.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { donorsController } from './donors.controller.js';
import { aliasDecisionSchema, aliasSchema, donorIdParamsSchema } from './donors.validation.js';

export function createDonorsRouter(controller = donorsController) {
  const router = Router();
  router.get('/me', controller.mine);
  router.get('/:donorId', validateRequest({ params: donorIdParamsSchema }), controller.get);
  router.post('/me/alias', validateRequest({ body: aliasSchema }), controller.requestAlias);
  router.post(
    '/:donorId/alias-decision',
    authorize(PERMISSIONS.USER_MANAGE),
    requireMfa,
    validateRequest({ params: donorIdParamsSchema, body: aliasDecisionSchema }),
    controller.decideAlias
  );
  return router;
}

export const donorsRouter = createDonorsRouter();

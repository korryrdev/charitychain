import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { requestAuditContext } from '../../middleware/auditContext.js';
import { authorize } from '../../middleware/authorize.js';
import { requireMfa } from '../../middleware/requireMfa.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { donorsController } from './donors.controller.js';
import {
  aliasDecisionSchema,
  aliasSchema,
  donorIdParamsSchema,
  donorRefParamsSchema,
  revealDonorIdentitySchema,
} from './donors.validation.js';
import { recognitionWallService } from './recognitionWall.service.js';

export function createDonorsRouter(
  controller = donorsController,
  wall = recognitionWallService
) {
  const router = Router();
  router.get('/me', controller.mine);

  router.get(
    '/references',
    authorize(PERMISSIONS.DONOR_IDENTITY_REVEAL),
    async (req, res, next) => {
      try {
        res.json(
          await wall.listDonorReferences({
            search: typeof req.query.search === 'string' ? req.query.search : '',
            page: req.query.page,
            pageSize: req.query.pageSize,
          })
        );
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/references/:donorRef',
    authorize(PERMISSIONS.DONOR_IDENTITY_REVEAL),
    validateRequest({ params: donorRefParamsSchema }),
    async (req, res, next) => {
      try {
        res.json(
          await wall.getDonorRefDetails(req.params.donorRef, { revealFull: false })
        );
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/references/:donorRef/reveal',
    authorize(PERMISSIONS.DONOR_IDENTITY_REVEAL),
    validateRequest({ params: donorRefParamsSchema, body: revealDonorIdentitySchema }),
    async (req, res, next) => {
      try {
        const revealed = await wall.getDonorRefDetails(req.params.donorRef, {
          revealFull: true,
          reason: req.body.reason,
          actorUserId: req.auth.user.id,
          context: requestAuditContext(req),
        });
        res.status(200).json(revealed);
      } catch (err) {
        next(err);
      }
    }
  );

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

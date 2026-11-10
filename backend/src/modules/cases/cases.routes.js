'use strict';

import { Router } from 'express';
import { casesService } from './cases.service.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createCaseSchema,
  caseDecisionSchema,
  authorizeReleaseSchema,
  recordDisbursementSchema,
} from './cases.validation.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';

export function createCasesRouter(service = casesService) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const cases = await service.listCases({
        subGroupId: req.query.subGroupId,
        state: req.query.state,
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20,
      });
      res.status(200).json({ items: cases });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/',
    authorize(PERMISSIONS.CASE_CREATE),
    validateRequest({ body: createCaseSchema }),
    async (req, res, next) => {
      try {
        const malkiaCase = await service.createCase({
          ...req.body,
          createdByUserId: req.auth.user.id,
        });
        res.status(201).json({ case: malkiaCase });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/:id', async (req, res, next) => {
    try {
      const includePii = req.auth?.permissions?.includes(PERMISSIONS.CASE_READ) || false;
      const malkiaCase = await service.getCase(req.params.id, includePii);
      if (!malkiaCase) {
        return res.status(404).json({ message: 'Case not found.' });
      }
      res.status(200).json({ case: malkiaCase });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/submit', async (req, res, next) => {
    try {
      const updated = await service.submitCase(req.params.id, req.auth.user.id);
      res.status(200).json({ case: updated });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/:id/decision',
    authorize(PERMISSIONS.CASE_DECIDE),
    validateRequest({ body: caseDecisionSchema }),
    async (req, res, next) => {
      try {
        const updated = await service.recordDecision(req.params.id, req.body, req.auth.user.id);
        res.status(200).json({ case: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/:id/authorize',
    authorize(PERMISSIONS.RELEASE_AUTHORIZE),
    validateRequest({ body: authorizeReleaseSchema }),
    async (req, res, next) => {
      try {
        const updated = await service.authorizeRelease(req.params.id, req.body, req.auth.user.id);
        res.status(200).json({ case: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/:id/disburse',
    authorize(PERMISSIONS.DISBURSEMENT_CREATE),
    validateRequest({ body: recordDisbursementSchema }),
    async (req, res, next) => {
      try {
        const result = await service.disburse(req.params.id, req.body, req.auth.user.id);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export const casesRouter = createCasesRouter();
export default casesRouter;

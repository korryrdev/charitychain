'use strict';

import { Router } from 'express';
import { bankService } from './bank.service.js';
import { bankReconciliationService } from './bankReconciliation.service.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createBankDepositSchema, verifyBankDepositSchema, importCsvSchema } from './bank.validation.js';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';

export function createBankRouter({
  service = bankService,
  reconService = bankReconciliationService
} = {}) {
  const router = Router();

  router.get(
    '/',
    authorizeAny(
      PERMISSIONS.BANK_DEPOSIT_CREATE,
      PERMISSIONS.BANK_DEPOSIT_VERIFY,
      PERMISSIONS.DONATION_READ_ALL
    ),
    async (req, res, next) => {
      try {
        const deposits = await service.listDeposits(req.query.status);
        res.status(200).json({ items: deposits });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/',
    authorize(PERMISSIONS.BANK_DEPOSIT_CREATE),
    validateRequest({ body: createBankDepositSchema }),
    async (req, res, next) => {
      try {
        const deposit = await service.createDeposit({
          ...req.body,
          enteredByUserId: req.auth.user.id,
        });
        res.status(201).json({ deposit });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/:id/verify',
    authorize(PERMISSIONS.BANK_DEPOSIT_VERIFY),
    validateRequest({ body: verifyBankDepositSchema }),
    async (req, res, next) => {
      try {
        const result = await service.verifyDeposit(
          req.params.id,
          req.auth.user.id,
          req.body.earmark
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/statements/import',
    authorize(PERMISSIONS.BANK_DEPOSIT_CREATE),
    validateRequest({ body: importCsvSchema }),
    async (req, res, next) => {
      try {
        const result = await reconService.importCsv(req.body.csv);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/reconciliation',
    authorize(PERMISSIONS.BANK_DEPOSIT_VERIFY),
    async (req, res, next) => {
      try {
        const result = await reconService.reconcile({
          windowDays: req.query.windowDays ? parseInt(req.query.windowDays, 10) : 7
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export const bankRouter = createBankRouter();
export default bankRouter;

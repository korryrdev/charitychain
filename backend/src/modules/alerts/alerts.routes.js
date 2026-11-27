'use strict';

import { Router } from 'express';
import { alertsService } from './alerts.service.js';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSIONS } from '../../constants/permissions.js';

export function createAlertsRouter(service = alertsService) {
  const router = Router();

  router.get(
    '/',
    authorize(PERMISSIONS.ALERT_READ),
    async (req, res, next) => {
      try {
        const alerts = await service.listAlerts({
          status: req.query.status,
          severity: req.query.severity,
          ruleId: req.query.ruleId,
          page: req.query.page ? parseInt(req.query.page, 10) : 1,
          pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50,
        });
        res.status(200).json({ items: alerts });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/rules',
    authorize(PERMISSIONS.ALERT_READ),
    async (req, res, next) => {
      try {
        const rules = await service.listRules();
        res.status(200).json({ items: rules });
      } catch (err) {
        next(err);
      }
    }
  );

  router.patch(
    '/rules/:id',
    authorize(PERMISSIONS.RULES_MANAGE),
    async (req, res, next) => {
      try {
        const updated = await service.updateRule(req.params.id, req.body);
        res.status(200).json({ rule: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/graph',
    authorize(PERMISSIONS.ALERT_READ),
    async (req, res, next) => {
      try {
        const graph = await service.getFundFlowGraph();
        res.status(200).json(graph);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.ALERT_READ),
    async (req, res, next) => {
      try {
        const alert = await service.getAlert(req.params.id);
        res.status(200).json({ alert });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/:id/resolve',
    authorize(PERMISSIONS.ALERT_RESOLVE),
    async (req, res, next) => {
      try {
        const updated = await service.resolveAlert(
          req.params.id,
          req.body,
          req.auth.user.id
        );
        res.status(200).json({ alert: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/scan',
    authorize(PERMISSIONS.ALERT_RESOLVE),
    async (req, res, next) => {
      try {
        const result = await service.runPhase1Rules();
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

export const alertsRouter = createAlertsRouter();
export default alertsRouter;

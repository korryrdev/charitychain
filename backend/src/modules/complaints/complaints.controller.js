'use strict';

import { requestAuditContext } from '../../middleware/auditContext.js';
import { appealsService } from './appeals.service.js';
import { complaintsService } from './complaints.service.js';

export function createComplaintsController({
  service = complaintsService,
  appeals = appealsService,
} = {}) {
  const handle = (operation) => async (req, res, next) => {
    try {
      await operation(req, res);
    } catch (err) {
      next(err);
    }
  };

  return {
    myAppeals: handle(async (req, res) =>
      res.json({ items: await appeals.mine(req.auth) })
    ),
    createAppeal: handle(async (req, res) =>
      res.status(201).json({ appeal: await appeals.create(req.auth, req.body) })
    ),
    listMine: handle(async (req, res) =>
      res.status(200).json({ items: await service.listMine(req.auth) })
    ),
    submitAuthenticated: handle(async (req, res) => {
      const complaint = await service.submitComplaint(req.body, {
        actorUserId: req.auth.user.id,
        context: requestAuditContext(req),
      });
      res.status(201).json({ complaint });
    }),
    submitPublicComplaint: handle(async (req, res) => {
      const complaint = await service.submitComplaint(req.body, {
        actorUserId: req.auth?.user?.id ?? null,
        context: requestAuditContext(req),
      });
      res.status(201).json({ complaint });
    }),
    submitPublicFraudReport: handle(async (req, res) => {
      const report = await service.submitFraudReport(req.body, {
        actorUserId: req.auth?.user?.id ?? null,
        context: requestAuditContext(req),
      });
      res.status(201).json({ report });
    }),
    listAll: handle(async (req, res) =>
      res.status(200).json({
        items: await service.listAll(req.auth, {
          kind: typeof req.query.kind === 'string' ? req.query.kind : undefined,
          status: typeof req.query.status === 'string' ? req.query.status : undefined,
          page: req.query.page,
          pageSize: req.query.pageSize,
        }),
      })
    ),
    resolve: handle(async (req, res) => {
      const complaint = await service.resolve(
        req.auth,
        req.params.id,
        req.body,
        requestAuditContext(req)
      );
      res.status(200).json({ complaint });
    }),
  };
}

export const complaintsController = createComplaintsController();

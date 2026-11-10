'use strict';

import { auditLogsService } from './auditLogs.service.js';

export function createAuditLogsController(service = auditLogsService) {
  const handle = (operation) => async (req, res, next) => { try { await operation(req, res); } catch (error) { next(error); } };
  return {
    record: handle(async (req, res) => res.status(201).json({ auditEvent: await service.record(req.auth, { ...req.body, ...req.audit }) })),
    search: handle(async (req, res) => res.json(await service.search(req.auth, req.query))),
    export: handle(async (req, res) => res.json(await service.export(req.auth, req.query))),
    verify: handle(async (req, res) => res.json(await service.verify(req.auth)))
  };
}

export const auditLogsController = createAuditLogsController();

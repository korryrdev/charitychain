'use strict';

import { blockchainAuditService } from './blockchainAudit.service.js';

export function createBlockchainAuditController(service = blockchainAuditService) {
  const handle = (operation) => async (req, res, next) => { try { await operation(req, res); } catch (error) { next(error); } };
  return {
    queue: handle(async (req, res) => res.status(201).json({ anchor: await service.queue(req.auth, req.body.evidenceId) })),
    get: handle(async (req, res) => res.json({ anchor: await service.get(req.auth, req.params.anchorId) })),
    submit: handle(async (req, res) => res.json({ anchor: await service.submit(req.auth, req.params.anchorId) })),
    monitor: handle(async (req, res) => res.json({ anchor: await service.monitor(req.auth, req.params.anchorId) }))
  };
}

export const blockchainAuditController = createBlockchainAuditController();

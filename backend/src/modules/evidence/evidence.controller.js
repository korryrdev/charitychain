'use strict';

import { evidenceService } from './evidence.service.js';

export function createEvidenceController(service = evidenceService) {
  const handle = (operation) => async (req, res, next) => {
    try { await operation(req, res); } catch (error) { next(error); }
  };
  return {
    create: handle(async (req, res) => res.status(201).json({ evidence: await service.create(req.auth, req.body) })),
    get: handle(async (req, res) => res.json({ evidence: await service.get(req.auth, req.params.evidenceId) })),
    list: handle(async (req, res) => res.json({ evidence: await service.list(req.auth, req.params.subjectType, req.params.subjectId) })),
    verify: handle(async (req, res) => res.json(await service.verify(req.auth, req.params.evidenceId))),
    expireDue: handle(async (req, res) => res.json({ expired: (await service.expireDue(req.auth)).count })),
    destroy: handle(async (req, res) => res.json({ evidence: await service.destroy(req.auth, req.params.evidenceId) }))
  };
}

export const evidenceController = createEvidenceController();

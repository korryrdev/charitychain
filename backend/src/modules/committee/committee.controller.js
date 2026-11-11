'use strict';

import { committeeService } from './committee.service.js';
import { conflictOfInterestService } from './conflictOfInterest.service.js';
import { membershipService } from './membership.service.js';

export function createCommitteeController({ committee = committeeService, memberships = membershipService, conflicts = conflictOfInterestService } = {}) { const handle = (operation) => async (req,res,next) => { try { await operation(req,res); } catch (error) { next(error); } }; return {
  list: handle(async (req,res) => res.json({ memberships: await committee.list(req.auth) })),
  mine: handle(async (req,res) => res.json({ membership: await committee.mine(req.auth) })),
  get: handle(async (req,res) => res.json({ membership: await committee.get(req.auth, req.params.membershipId) })),
  appoint: handle(async (req,res) => res.status(201).json({ membership: await memberships.appoint(req.auth, req.body) })),
  suspend: handle(async (req,res) => res.json({ membership: await memberships.suspend(req.auth, req.params.membershipId, req.body) })),
  reactivate: handle(async (req,res) => res.json({ membership: await memberships.reactivate(req.auth, req.params.membershipId, req.body) })),
  end: handle(async (req,res) => res.json({ membership: await memberships.end(req.auth, req.params.membershipId, req.body) })),
  listConflicts: handle(async (req,res) => res.json({ conflicts: await conflicts.list(req.auth, req.params.applicationId) })),
  declareConflict: handle(async (req,res) => res.status(201).json({ conflict: await conflicts.declare(req.auth, req.params.applicationId, req.body) })),
  resolveConflict: handle(async (req,res) => res.json({ conflict: await conflicts.resolve(req.auth, req.params.conflictId, req.body) }))
}; }
export const committeeController = createCommitteeController();

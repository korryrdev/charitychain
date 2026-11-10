'use strict';

import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { committeeController } from './committee.controller.js';
import { applicationConflictParamsSchema, conflictParamsSchema, createMembershipSchema, declareConflictSchema, membershipParamsSchema, membershipTransitionSchema, resolveConflictSchema } from './committee.validation.js';

export function createCommitteeRouter(controller = committeeController) { const router = Router();
  router.get('/me', controller.mine);
  router.get('/members', controller.list);
  router.post('/members', authorize(PERMISSIONS.COMMITTEE_MANAGE), validateRequest({ body: createMembershipSchema }), controller.appoint);
  router.get('/members/:membershipId', validateRequest({ params: membershipParamsSchema }), controller.get);
  router.post('/members/:membershipId/suspend', authorize(PERMISSIONS.COMMITTEE_MANAGE), validateRequest({ params: membershipParamsSchema, body: membershipTransitionSchema }), controller.suspend);
  router.post('/members/:membershipId/reactivate', authorize(PERMISSIONS.COMMITTEE_MANAGE), validateRequest({ params: membershipParamsSchema, body: membershipTransitionSchema }), controller.reactivate);
  router.post('/members/:membershipId/end', authorize(PERMISSIONS.COMMITTEE_MANAGE), validateRequest({ params: membershipParamsSchema, body: membershipTransitionSchema }), controller.end);
  router.get('/applications/:applicationId/conflicts', validateRequest({ params: applicationConflictParamsSchema }), controller.listConflicts);
  router.post('/applications/:applicationId/conflicts', validateRequest({ params: applicationConflictParamsSchema, body: declareConflictSchema }), controller.declareConflict);
  router.post('/conflicts/:conflictId/resolve', authorize(PERMISSIONS.COMMITTEE_MANAGE), validateRequest({ params: conflictParamsSchema, body: resolveConflictSchema }), controller.resolveConflict);
  return router;
}
export const committeeRouter = createCommitteeRouter();

import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '../../constants/permissions.js';
import { authorize } from '../../middleware/authorize.js';
import { requireMfa } from '../../middleware/requireMfa.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { sessionsController } from './sessions.controller.js';

const sessionParams = z.object({ sessionId: z.uuid() });
const userParams = z.object({ userId: z.uuid() });
const revokeAllBody = z.object({ exceptCurrent: z.boolean().default(true) });

export function createSessionsRouter(controller = sessionsController) {
  const router = Router();
  router.get('/', controller.listMine);
  router.delete('/:sessionId', validateRequest({ params: sessionParams }), controller.revoke);
  router.get(
    '/users/:userId',
    authorize(PERMISSIONS.USER_MANAGE),
    validateRequest({ params: userParams }),
    controller.listForUser
  );
  router.delete(
    '/users/:userId',
    authorize(PERMISSIONS.USER_MANAGE),
    requireMfa,
    validateRequest({ params: userParams, body: revokeAllBody }),
    controller.revokeAll
  );
  return router;
}

export const sessionsRouter = createSessionsRouter();

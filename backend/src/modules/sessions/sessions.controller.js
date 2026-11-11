import { sessionsService } from './sessions.service.js';

export function createSessionsController(service = sessionsService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    listMine: handle(async (req, res) => res.json({ sessions: await service.list(req.auth) })),
    listForUser: handle(async (req, res) =>
      res.json({ sessions: await service.list(req.auth, req.params.userId) })
    ),
    revoke: handle(async (req, res) => {
      await service.revoke(req.auth, req.params.sessionId);
      res.status(204).end();
    }),
    revokeAll: handle(async (req, res) => {
      await service.revokeAll(req.auth, req.params.userId, req.body.exceptCurrent);
      res.status(204).end();
    })
  };
}

export const sessionsController = createSessionsController();

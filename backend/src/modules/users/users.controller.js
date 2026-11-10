import { usersService } from './users.service.js';

export function createUsersController(service = usersService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    me: handle(async (req, res) =>
      res.json({ user: await service.get(req.auth, req.auth.user.id) })
    ),
    get: handle(async (req, res) =>
      res.json({ user: await service.get(req.auth, req.params.userId) })
    ),
    list: handle(async (req, res) => res.json(await service.list(req.query))),
    updateProfile: handle(async (req, res) =>
      res.json({ user: await service.updateProfile(req.auth, req.params.userId, req.body) })
    ),
    updateStatus: handle(async (req, res) =>
      res.json({ user: await service.updateStatus(req.params.userId, req.body.status) })
    )
  };
}

export const usersController = createUsersController();

import { usersService } from './users.service.js';

function requestHeaders(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
}

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
    closeOwnAccount: handle(async (req, res) => {
      await service.closeOwnAccount(req.auth, req.body.password, requestHeaders(req));
      res.status(204).end();
    }),
    get: handle(async (req, res) =>
      res.json({ user: await service.get(req.auth, req.params.userId) })
    ),
    list: handle(async (req, res) => res.json(await service.list(req.query))),
    createStaffAccount: handle(async (req, res) =>
      res.status(201).json(await service.createStaffAccount(req.body))
    ),
    updateProfile: handle(async (req, res) =>
      res.json({ user: await service.updateProfile(req.auth, req.params.userId, req.body) })
    ),
    updateStatus: handle(async (req, res) =>
      res.json({ user: await service.updateStatus(req.params.userId, req.body.status) })
    ),
    deleteManagedAccount: handle(async (req, res) => {
      await service.deleteManagedAccount(req.auth, req.params.userId);
      res.status(204).end();
    })
  };
}

export const usersController = createUsersController();

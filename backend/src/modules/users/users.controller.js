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
    changeOwnPassword: handle(async (req, res) => {
      const context = {
        ip: req.ip,
        requestId: req.id,
        requestMethod: req.method,
        requestPath: req.originalUrl?.split('?')[0],
        userAgent: req.get('user-agent')
      };
      res.status(200).json(await service.changeOwnPassword(req.auth, req.body, context));
    }),
    closeOwnAccount: handle(async (req, res) => {
      await service.closeOwnAccount(req.auth, req.body.password, requestHeaders(req));
      res.status(204).end();
    }),
    get: handle(async (req, res) =>
      res.json({ user: await service.get(req.auth, req.params.userId) })
    ),
    list: handle(async (req, res) => res.json(await service.list(req.query))),
    create: handle(async (req, res) =>
      res.status(201).json({ user: await service.createUser(req.auth, req.body) })
    ),
    createStaffAccount: handle(async (req, res) =>
      res.status(201).json(await service.createStaffAccount(req.body))
    ),
    updateProfile: handle(async (req, res) =>
      res.json({ user: await service.updateProfile(req.auth, req.params.userId, req.body) })
    ),
    updateRoles: handle(async (req, res) =>
      res.json({ user: await service.updateRoles(req.auth, req.params.userId, req.body.roles) })
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

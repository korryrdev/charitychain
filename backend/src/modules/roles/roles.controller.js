import { rolesService } from './roles.service.js';

export function createRolesController(service = rolesService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    list: handle(async (_req, res) => res.json({ roles: await service.list() })),
    assign: handle(async (req, res) => {
      await service.assign(req.params.userId, req.params.roleCode);
      res.status(204).end();
    }),
    remove: handle(async (req, res) => {
      await service.remove(req.params.userId, req.params.roleCode);
      res.status(204).end();
    }),
    setPermissions: handle(async (req, res) =>
      res.json(await service.setPermissions(req.params.roleCode, req.body.permissions))
    )
  };
}

export const rolesController = createRolesController();

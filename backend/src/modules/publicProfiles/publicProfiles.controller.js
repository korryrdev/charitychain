import { publicProfilesService } from './publicProfiles.service.js';

export function createPublicProfilesController(service = publicProfilesService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    get: handle(async (req, res) =>
      res.json({ donor: await service.getPublic(req.params.donorId) })
    ),
    list: handle(async (req, res) => res.json(await service.list(req.query))),
    updateMine: handle(async (req, res) =>
      res.json({ settings: await service.updateMine(req.auth, req.body) })
    )
  };
}

export const publicProfilesController = createPublicProfilesController();

import { donorsService } from './donors.service.js';

export function createDonorsController(service = donorsService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    mine: handle(async (req, res) => res.json({ donor: await service.getMine(req.auth) })),
    get: handle(async (req, res) =>
      res.json({ donor: await service.get(req.auth, req.params.donorId) })
    ),
    requestAlias: handle(async (req, res) =>
      res.status(202).json({ donor: await service.requestAlias(req.auth, req.body.alias) })
    ),
    decideAlias: handle(async (req, res) =>
      res.json({ donor: await service.decideAlias(req.params.donorId, req.body.approved) })
    )
  };
}

export const donorsController = createDonorsController();

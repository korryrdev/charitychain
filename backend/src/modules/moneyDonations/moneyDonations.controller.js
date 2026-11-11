import { moneyDonationsService } from './moneyDonations.service.js';

export function createMoneyDonationsController(service = moneyDonationsService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    create: handle(async (req, res) =>
      res
        .status(201)
        .json(await service.create(req.auth, req.body, req.get('idempotency-key')))
    ),
    get: handle(async (req, res) =>
      res.json({ donation: await service.get(req.auth, req.params.donationId) })
    ),
    listMine: handle(async (req, res) => res.json(await service.listMine(req.auth, req.query))),
    track: handle(async (req, res) =>
      res.json({ donation: await service.track(req.body.trackingId, req.body.verificationSecret) })
    )
  };
}

export const moneyDonationsController = createMoneyDonationsController();

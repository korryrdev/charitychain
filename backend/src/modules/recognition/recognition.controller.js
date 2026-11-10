import { recognitionService } from './recognition.service.js';

export function createRecognitionController(service = recognitionService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    tiers: handle(async (_req, res) => res.json({ tiers: await service.listTiers() })),
    mine: handle(async (req, res) => res.json({ recognition: await service.mine(req.auth) })),
    history: handle(async (req, res) => res.json(await service.history(req.auth, req.query)))
  };
}

export const recognitionController = createRecognitionController();

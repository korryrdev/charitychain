import { paymentsService } from './payments.service.js';

export function createPaymentsController(service = paymentsService) {
  const handle = (operation) => async (request, response, next) => { try { await operation(request, response); } catch (error) { next(error); } };
  return {
    initiate: handle(async (req, res) => res.status(202).json({ payment: await service.initiate(req.auth, req.body, req.get('idempotency-key')) })),
    get: handle(async (req, res) => res.json({ payment: await service.get(req.auth, req.params.paymentId) })),
    listForDonation: handle(async (req, res) => res.json({ items: await service.listForDonation(req.auth, req.params.donationId) })),
    webhook: handle(async (req, res) => res.status(202).json(await service.processProviderEvent(req.params.provider, req.body, req.get('x-provider-signature'))))
  };
}
export const paymentsController = createPaymentsController();

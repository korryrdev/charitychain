import { confirmationsRepository } from '../../modules/confirmations/confirmations.repository.js';
export function createDeliveryStatusController(repository = confirmationsRepository) { return { async update(request, response, next) { try { await repository.updateDeliveryStatus(request.body.providerMessageId, request.body.status, request.body.failureReason); response.status(204).end(); } catch (error) { next(error); } } }; }
export const deliveryStatusController = createDeliveryStatusController();

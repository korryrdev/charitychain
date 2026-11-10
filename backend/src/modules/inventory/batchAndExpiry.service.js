import { inventoryRepository } from './inventory.repository.js';
export function createBatchAndExpiryService(repository = inventoryRepository) { return { async expireDue(now = new Date(), actorUserId = null) { const batches = await repository.batchesExpired(now); const expired = []; for (const batch of batches) { if (batch.reservedQuantity > 0) continue; expired.push(await repository.expireBatch(batch, actorUserId)); } return expired; } }; }
export const batchAndExpiryService = createBatchAndExpiryService();

import { ConflictError } from '../../errors/ConflictError.js';
import { assertInventoryManage } from './inventory.policy.js';
import { inventoryRepository } from './inventory.repository.js';
export function createStockCountService(repository = inventoryRepository) { return { async count(auth, input) { assertInventoryManage(auth); try { return await repository.createStockCount(input, auth.user.id); } catch (error) { if (error.message === 'COUNT_LOCATION_MISMATCH') throw new ConflictError('Every counted batch must belong to the selected location.'); if (error.message === 'COUNT_RESERVED_SHORTAGE') throw new ConflictError('Count cannot reduce stock below active reservations.'); throw error; } } }; }
export const stockCountService = createStockCountService();

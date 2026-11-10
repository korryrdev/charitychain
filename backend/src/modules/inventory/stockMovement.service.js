import { inventoryService } from './inventory.service.js';
export const stockMovementService = Object.freeze({ adjust: (...args) => inventoryService.adjust(...args) });

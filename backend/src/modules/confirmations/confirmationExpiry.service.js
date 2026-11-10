import { confirmationsRepository } from './confirmations.repository.js';
export function createConfirmationExpiryService(repository = confirmationsRepository) { return { expireDue: (now = new Date()) => repository.expireDue(now), isExpired: (request, now = new Date()) => request.expiresAt <= now }; }
export const confirmationExpiryService = createConfirmationExpiryService();

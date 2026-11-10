import { confirmationExpiryService } from '../modules/confirmations/confirmationExpiry.service.js';
import { createScheduledJob } from './jobFactory.js';
export const createConfirmationExpiryJob = ({ expiry = confirmationExpiryService, intervalMs = 60_000 } = {}) => createScheduledJob({ name: 'confirmation-expiry', intervalMs, execute: () => expiry.expireDue() });

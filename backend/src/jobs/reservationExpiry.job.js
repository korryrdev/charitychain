import { reservationService } from '../modules/inventory/reservation.service.js';
import { createScheduledJob } from './jobFactory.js';
export const createReservationExpiryJob = ({ reservations = reservationService, intervalMs = 60_000 } = {}) => createScheduledJob({ name: 'reservation-expiry', intervalMs, execute: () => reservations.expireDue() });

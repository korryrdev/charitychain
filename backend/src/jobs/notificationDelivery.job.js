import { createScheduledJob } from './jobFactory.js';
export const createNotificationDeliveryJob = ({ deliver, intervalMs = 60_000 } = {}) => createScheduledJob({ name: 'notification-delivery', intervalMs, execute: () => deliver() });

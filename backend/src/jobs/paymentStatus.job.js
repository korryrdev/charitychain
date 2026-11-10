import { createScheduledJob } from './jobFactory.js';
export const createPaymentStatusJob = ({ refresh, intervalMs = 2 * 60_000 } = {}) => createScheduledJob({ name: 'payment-status', intervalMs, execute: () => refresh() });

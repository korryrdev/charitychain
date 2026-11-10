import { createScheduledJob } from './jobFactory.js';
export const createReconciliationJob = ({ reconcile, intervalMs = 24 * 60 * 60_000 } = {}) => createScheduledJob({ name: 'reconciliation', intervalMs, execute: () => reconcile() });

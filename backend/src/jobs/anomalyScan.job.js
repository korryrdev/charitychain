import { createScheduledJob } from './jobFactory.js';
export const createAnomalyScanJob = ({ scan, intervalMs = 15 * 60_000 } = {}) => createScheduledJob({ name: 'anomaly-scan', intervalMs, execute: () => scan() });

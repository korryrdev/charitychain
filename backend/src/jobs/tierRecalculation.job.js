import { createScheduledJob } from './jobFactory.js';
export const createTierRecalculationJob = ({ recalculate, intervalMs = 6 * 60 * 60_000 } = {}) => createScheduledJob({ name: 'tier-recalculation', intervalMs, execute: () => recalculate() });

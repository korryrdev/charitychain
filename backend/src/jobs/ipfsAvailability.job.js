import { createScheduledJob } from './jobFactory.js';
export const createIpfsAvailabilityJob = ({ check, intervalMs = 5 * 60_000 } = {}) => createScheduledJob({ name: 'ipfs-availability', intervalMs, execute: () => check() });

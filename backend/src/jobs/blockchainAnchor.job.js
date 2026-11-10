import { createScheduledJob } from './jobFactory.js';
export const createBlockchainAnchorJob = ({ anchor, intervalMs = 5 * 60_000 } = {}) => createScheduledJob({ name: 'blockchain-anchor', intervalMs, execute: () => anchor() });

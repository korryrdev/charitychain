import { createScheduledJob } from './jobFactory.js';
export const createTransparencyRefreshJob = ({ refresh, intervalMs = 5 * 60_000 } = {}) => createScheduledJob({ name: 'transparency-refresh', intervalMs, execute: () => refresh() });

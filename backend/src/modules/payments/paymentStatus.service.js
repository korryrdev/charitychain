import { ConflictError } from '../../errors/ConflictError.js';
const terminal = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);
export function assertProviderStatusApplicable(attempt, nextStatus) { if (terminal.has(attempt.status) && attempt.status !== nextStatus) throw new ConflictError(`A terminal ${attempt.status} payment cannot become ${nextStatus}.`); }
export function paymentStatusFields(status, event) { if (status === 'SUCCEEDED') return { completedAt: event.occurredAt ?? new Date(), failedAt: null }; if (status === 'FAILED') return { failedAt: event.occurredAt ?? new Date() }; return {}; }

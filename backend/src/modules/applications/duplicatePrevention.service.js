import { ConflictError } from '../../errors/ConflictError.js';
export function assertNoDuplicateApplication(existing) { if (existing) throw new ConflictError('A student may submit only one application of each type per semester.'); }

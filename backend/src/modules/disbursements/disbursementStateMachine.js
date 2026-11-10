'use strict';

import { ConflictError } from '../../errors/ConflictError.js';
export const DISBURSEMENT_TRANSITIONS = Object.freeze({ CREATED: ['PROCESSING'], PROCESSING: ['SUCCEEDED','FAILED'], FAILED: ['PROCESSING'], SUCCEEDED: ['REVERSED'], REVERSED: [] });
export function assertDisbursementTransition(from, to) { if (!DISBURSEMENT_TRANSITIONS[from]?.includes(to)) throw new ConflictError(`Disbursement cannot transition from ${from} to ${to}.`); }

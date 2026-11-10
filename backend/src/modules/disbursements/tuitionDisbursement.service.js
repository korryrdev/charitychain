'use strict';

import { b2bAdapter } from '../../integrations/mpesa/b2b.adapter.js';
export function createTuitionDisbursementService(provider = b2bAdapter) { return { send(disbursement) { return provider.send({ amount: disbursement.amount, accountReference: disbursement.destinationReference, remarks: `CharityChain tuition payment ${disbursement.application.reference}` }); } }; }
export const tuitionDisbursementService = createTuitionDisbursementService();

'use strict';

import { b2cAdapter } from '../../integrations/mpesa/b2c.adapter.js';
export function createUpkeepDisbursementService(provider = b2cAdapter) { return { send(disbursement) { return provider.send({ amount: disbursement.amount, phone: disbursement.destination, reference: disbursement.destinationReference, remarks: `CharityChain upkeep payment ${disbursement.application.reference}` }); } }; }
export const upkeepDisbursementService = createUpkeepDisbursementService();

'use strict';
import { transactionStatusAdapter } from './transactionStatus.adapter.js';
export function createMpesaReconciliationAdapter({ statusAdapter = transactionStatusAdapter } = {}) { return { async reconcile({ providerTransactionId, reference }) { const result = await statusAdapter.query({ transactionId: providerTransactionId, reference }); return { provider: 'MPESA', providerTransactionId, providerRequestId: result.providerRequestId, status: result.status, raw: result.response }; } }; }
export const mpesaReconciliationAdapter = createMpesaReconciliationAdapter();

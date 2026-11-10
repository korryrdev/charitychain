'use strict';
import { createBankProvider } from './bankProviderFactory.js';
export function createBankReconciliationAdapter({ provider = createBankProvider() } = {}) { return { async reconcile(input) { if (typeof provider.reconcile !== 'function') throw new TypeError('Selected bank provider does not support reconciliation.'); return provider.reconcile(input); } }; }
export const bankReconciliationAdapter = createBankReconciliationAdapter();

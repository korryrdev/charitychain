'use strict';

import { reconciliationRepository } from './reconciliation.repository.js';
export function createLedgerPostingService(repository = reconciliationRepository) { return { async post(item) { try { return await repository.postJournal(item); } catch (error) { if (error.code === 'P2002') return repository.findJournal(item.sourceType, item.sourceId); throw error; } } }; }
export const ledgerPostingService = createLedgerPostingService();

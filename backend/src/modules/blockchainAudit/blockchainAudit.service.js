'use strict';

import { randomBytes } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { anchorQueueService } from './anchorQueue.service.js';
import { commitmentBuilderService } from './commitmentBuilder.service.js';
import { assertCanManageBlockchainAudit, assertCanReadBlockchainAudit } from './blockchainAudit.policy.js';
import { blockchainAuditRepository } from './blockchainAudit.repository.js';
import { transactionMonitorService } from './transactionMonitor.service.js';

function notFound() { return new AppError({ message: 'Blockchain anchor not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 }); }
function mapAnchor(anchor) {
  return { id: anchor.id, reference: anchor.reference, evidenceId: anchor.evidenceId, commitment: anchor.commitment, subjectKey: anchor.subjectKey, previousCommitment: anchor.previousCommitment, status: anchor.status, network: anchor.network, contractAddress: anchor.contractAddress, transactionHash: anchor.transactionHash, blockNumber: anchor.blockNumber?.toString() ?? null, confirmations: anchor.confirmations, requiredConfirmations: anchor.requiredConfirmations, attemptCount: anchor.attemptCount, lastError: anchor.lastError, submittedAt: anchor.submittedAt, confirmedAt: anchor.confirmedAt, failedAt: anchor.failedAt, createdAt: anchor.createdAt, attempts: anchor.attempts?.map((attempt) => ({ sequence: attempt.sequence, status: attempt.status, transactionHash: attempt.transactionHash, errorMessage: attempt.errorMessage, startedAt: attempt.startedAt, completedAt: attempt.completedAt })) ?? [] };
}
function chainFailure(error) {
  if (error instanceof AppError) return error;
  return new AppError({ message: 'Blockchain anchor operation failed.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: error.retryable === false ? 422 : 503, cause: error });
}

export function createBlockchainAuditService({ repository = blockchainAuditRepository, builder = commitmentBuilderService, queue = anchorQueueService, monitor = transactionMonitorService, network = 'localhost', requiredConfirmations = 2 } = {}) {
  return {
    async queue(auth, evidenceId) {
      assertCanManageBlockchainAudit(auth);
      const existing = await repository.findByEvidence(evidenceId);
      if (existing) return mapAnchor(existing);
      const evidence = await repository.findEvidence(evidenceId);
      if (!evidence || evidence.status === 'DESTROYED') throw new AppError({ message: 'Active evidence is required before anchoring.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 });
      const precursor = builder.build(evidence);
      const latest = await repository.latestForSubject(precursor.subjectKey);
      const commitment = builder.build(evidence, latest?.commitment ?? null);
      try {
        return mapAnchor(await repository.create({ reference: `ANC-${new Date().getUTCFullYear()}-${randomBytes(8).toString('hex').toUpperCase()}`, evidenceId, ...commitment, network, requiredConfirmations, queuedByUserId: auth.user.id }));
      } catch (error) {
        if (error.code === 'P2002') return mapAnchor(await repository.findByEvidence(evidenceId));
        throw error;
      }
    },
    async get(auth, id) { assertCanReadBlockchainAudit(auth); const anchor = await repository.findAnchor(id); if (!anchor) throw notFound(); return mapAnchor(anchor); },
    async submit(auth, id) { assertCanManageBlockchainAudit(auth); const anchor = await repository.findAnchor(id); if (!anchor) throw notFound(); if (anchor.status === 'CONFIRMED') return mapAnchor(anchor); try { return mapAnchor(await queue.submit(anchor)); } catch (error) { throw chainFailure(error); } },
    async monitor(auth, id) { assertCanManageBlockchainAudit(auth); const anchor = await repository.findAnchor(id); if (!anchor) throw notFound(); if (anchor.status === 'CONFIRMED') return mapAnchor(anchor); try { return mapAnchor(await monitor.monitor(anchor)); } catch (error) { throw chainFailure(error); } }
  };
}

export const blockchainAuditService = createBlockchainAuditService();

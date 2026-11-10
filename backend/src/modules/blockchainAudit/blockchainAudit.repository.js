'use strict';

import { prisma } from '@charitychain/database';

const include = { evidence: true, attempts: { orderBy: { sequence: 'asc' } } };

export function createBlockchainAuditRepository(database = prisma) {
  return {
    findEvidence(id) { return database.evidenceRecord.findUnique({ where: { id } }); },
    findAnchor(id) { return database.blockchainAnchor.findUnique({ where: { id }, include }); },
    findByEvidence(evidenceId) { return database.blockchainAnchor.findUnique({ where: { evidenceId }, include }); },
    latestForSubject(subjectKey) { return database.blockchainAnchor.findFirst({ where: { subjectKey, status: { not: 'FAILED' } }, orderBy: { createdAt: 'desc' } }); },
    findByCommitment(commitment) { return database.blockchainAnchor.findUnique({ where: { commitment } }); },
    create(data) { return database.blockchainAnchor.create({ data, include }); },
    async startAttempt(anchor) {
      return database.$transaction(async (tx) => {
        const current = await tx.blockchainAnchor.findUniqueOrThrow({ where: { id: anchor.id } });
        const sequence = current.attemptCount + 1;
        await tx.blockchainAnchor.update({ where: { id: anchor.id }, data: { attemptCount: sequence, status: 'QUEUED', lastError: null, failedAt: null } });
        return tx.blockchainAnchorAttempt.create({ data: { anchorId: anchor.id, sequence, status: 'QUEUED' } });
      });
    },
    submitted(anchorId, attemptId, result) {
      return database.$transaction(async (tx) => {
        await tx.blockchainAnchorAttempt.update({ where: { id: attemptId }, data: { status: 'SUBMITTED', transactionHash: result.transactionHash, completedAt: new Date() } });
        return tx.blockchainAnchor.update({ where: { id: anchorId }, data: { status: 'SUBMITTED', transactionHash: result.transactionHash, contractAddress: result.contractAddress, blockNumber: BigInt(result.blockNumber), submittedAt: new Date() }, include });
      });
    },
    failed(anchorId, attemptId, message) {
      return database.$transaction(async (tx) => {
        await tx.blockchainAnchorAttempt.update({ where: { id: attemptId }, data: { status: 'FAILED', errorMessage: message, completedAt: new Date() } });
        return tx.blockchainAnchor.update({ where: { id: anchorId }, data: { status: 'FAILED', lastError: message, failedAt: new Date() }, include });
      });
    },
    monitored(id, state) {
      return database.blockchainAnchor.update({ where: { id }, data: state.state === 'CONFIRMED' ? { status: 'CONFIRMED', confirmations: state.confirmations, blockNumber: BigInt(state.blockNumber), confirmedAt: new Date(), lastError: null } : state.state === 'FAILED' ? { status: 'FAILED', confirmations: state.confirmations, blockNumber: BigInt(state.blockNumber), failedAt: new Date(), lastError: 'On-chain transaction reverted.' } : { confirmations: state.confirmations }, include });
    }
  };
}

export const blockchainAuditRepository = createBlockchainAuditRepository();

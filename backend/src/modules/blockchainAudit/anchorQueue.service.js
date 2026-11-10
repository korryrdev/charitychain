'use strict';

import { BlockchainError } from '../../integrations/blockchain/blockchain.errors.js';
import { createWeb3Client } from '../../integrations/blockchain/web3.client.js';
import { attachServiceSigner } from '../../integrations/blockchain/transactionSigner.js';
import { createTransactionSubmitter } from '../../integrations/blockchain/transactionSubmitter.js';
import { blockchainConfig } from '../../config/blockchain.js';
import { blockchainAuditRepository } from './blockchainAudit.repository.js';

export function createDefaultBlockchainGateway() {
  const web3 = createWeb3Client();
  const account = attachServiceSigner(web3);
  const submitter = createTransactionSubmitter({ web3, account });
  return { submit: (anchor) => submitter.submit(anchor) };
}

export function createAnchorQueueService({ repository, gatewayFactory = createDefaultBlockchainGateway } = {}) {
  return {
    async submit(anchor) {
      if (!blockchainConfig.enabled && gatewayFactory === createDefaultBlockchainGateway) throw new BlockchainError('Blockchain anchoring is disabled.', { retryable: false });
      const previous = anchor.previousCommitment ? await repository.findByCommitment(anchor.previousCommitment) : null;
      if (anchor.previousCommitment && (!previous || previous.commitment !== anchor.previousCommitment || previous.status !== 'CONFIRMED')) {
        throw new BlockchainError('Anchor predecessor has not been confirmed.', { retryable: true });
      }
      const attempt = await repository.startAttempt(anchor);
      try {
        const result = await gatewayFactory().submit(anchor);
        return repository.submitted(anchor.id, attempt.id, result);
      } catch (error) {
        await repository.failed(anchor.id, attempt.id, error.message);
        throw error;
      }
    }
  };
}

export const anchorQueueService = createAnchorQueueService({ repository: blockchainAuditRepository });

'use strict';

import { blockchainConfig } from '../../config/blockchain.js';
import { BlockchainError } from '../../integrations/blockchain/blockchain.errors.js';
import { createConfirmationMonitor } from '../../integrations/blockchain/confirmationMonitor.js';
import { createWeb3Client } from '../../integrations/blockchain/web3.client.js';
import { blockchainAuditRepository } from './blockchainAudit.repository.js';

export function createDefaultMonitorGateway() {
  const web3 = createWeb3Client();
  const monitor = createConfirmationMonitor(web3);
  return { inspect: (transactionHash, confirmations) => monitor.inspect(transactionHash, confirmations) };
}

export function createTransactionMonitorService({ repository, gatewayFactory = createDefaultMonitorGateway } = {}) {
  return {
    async monitor(anchor) {
      if (!anchor.transactionHash) throw new BlockchainError('Anchor has not been submitted.', { retryable: false });
      if (!blockchainConfig.enabled && gatewayFactory === createDefaultMonitorGateway) throw new BlockchainError('Blockchain anchoring is disabled.', { retryable: false });
      const result = await gatewayFactory().inspect(anchor.transactionHash, anchor.requiredConfirmations);
      return repository.monitored(anchor.id, result);
    }
  };
}

export const transactionMonitorService = createTransactionMonitorService({ repository: blockchainAuditRepository });

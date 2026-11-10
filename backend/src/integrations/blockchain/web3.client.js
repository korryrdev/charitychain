'use strict';

import { Web3 } from 'web3';
import { web3Config } from './web3.config.js';
import { BlockchainError } from './blockchain.errors.js';

export function createWeb3Client(config = web3Config) {
  if (!config.enabled || !config.rpcUrl) throw new BlockchainError('Blockchain anchoring is disabled or unconfigured.', { retryable: false });
  return new Web3(config.rpcUrl);
}

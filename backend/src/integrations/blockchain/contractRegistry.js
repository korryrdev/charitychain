'use strict';

import { web3Config } from './web3.config.js';
import { BlockchainError } from './blockchain.errors.js';

const evidenceRegistryAbi = Object.freeze([
  { type: 'function', name: 'anchor', stateMutability: 'nonpayable', inputs: [
    { name: 'commitment', type: 'bytes32' }, { name: 'subjectKey', type: 'bytes32' }, { name: 'previousCommitment', type: 'bytes32' }
  ], outputs: [] },
  { type: 'function', name: 'isAnchored', stateMutability: 'view', inputs: [{ name: 'commitment', type: 'bytes32' }], outputs: [{ type: 'bool' }] }
]);

export function getEvidenceRegistry(web3, address = web3Config.auditContractAddress) {
  if (!address) throw new BlockchainError('EvidenceRegistry contract address is not configured.', { retryable: false });
  if (!web3.utils.isAddress(address)) throw new BlockchainError('EvidenceRegistry contract address is invalid.', { retryable: false });
  return new web3.eth.Contract(evidenceRegistryAbi, address);
}

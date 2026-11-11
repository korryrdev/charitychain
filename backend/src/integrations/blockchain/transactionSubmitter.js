'use strict';

import { getEvidenceRegistry } from './contractRegistry.js';
import { BlockchainError } from './blockchain.errors.js';

export function createTransactionSubmitter({ web3, account, contract = getEvidenceRegistry(web3) }) {
  return {
    async submit(anchor) {
      try {
        const receipt = await contract.methods.anchor(anchor.commitment, anchor.subjectKey, anchor.previousCommitment ?? `0x${'0'.repeat(64)}`).send({ from: account.address });
        return { transactionHash: receipt.transactionHash, blockNumber: Number(receipt.blockNumber), contractAddress: contract.options.address };
      } catch (error) {
        throw new BlockchainError('Blockchain anchor submission failed.', { cause: error });
      }
    }
  };
}

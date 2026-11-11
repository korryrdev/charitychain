'use strict';

import { getTransactionReceipt } from './transactionReceipt.js';

export function createConfirmationMonitor(web3) {
  return {
    async inspect(transactionHash, requiredConfirmations) {
      const receipt = await getTransactionReceipt(web3, transactionHash);
      if (!receipt) return { state: 'PENDING', confirmations: 0 };
      if (!receipt.status) return { state: 'FAILED', confirmations: 0, blockNumber: Number(receipt.blockNumber) };
      const currentBlock = Number(await web3.eth.getBlockNumber());
      const blockNumber = Number(receipt.blockNumber);
      const confirmations = Math.max(0, currentBlock - blockNumber + 1);
      return { state: confirmations >= requiredConfirmations ? 'CONFIRMED' : 'PENDING', confirmations, blockNumber };
    }
  };
}

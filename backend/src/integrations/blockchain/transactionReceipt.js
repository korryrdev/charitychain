'use strict';

import { BlockchainError } from './blockchain.errors.js';

export async function getTransactionReceipt(web3, transactionHash) {
  try { return await web3.eth.getTransactionReceipt(transactionHash); } catch (error) { throw new BlockchainError('Blockchain receipt lookup failed.', { cause: error }); }
}

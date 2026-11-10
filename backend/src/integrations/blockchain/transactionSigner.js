'use strict';

import { web3Config } from './web3.config.js';
import { BlockchainError } from './blockchain.errors.js';

export function attachServiceSigner(web3, privateKey = web3Config.servicePrivateKey) {
  if (!privateKey) throw new BlockchainError('Blockchain service signing key is not configured.', { retryable: false });
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  return account;
}

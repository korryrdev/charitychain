'use strict';

import { blockchainConfig } from '../../config/blockchain.js';

export const web3Config = Object.freeze({ ...blockchainConfig, requestTimeoutMs: 20_000 });

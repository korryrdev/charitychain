'use strict';

import { integrationsConfig } from '../../config/integrations.js';

export const ipfsConfig = Object.freeze({
  ...integrationsConfig.ipfs,
  requestTimeoutMs: 15_000,
  maximumBytes: 5 * 1024 * 1024
});

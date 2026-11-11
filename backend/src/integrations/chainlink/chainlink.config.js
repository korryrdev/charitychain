'use strict';
import { integrationsConfig } from '../../config/integrations.js';
export const chainlinkConfig = Object.freeze({ ...integrationsConfig.chainlink, requestTimeoutMs: 15000 });

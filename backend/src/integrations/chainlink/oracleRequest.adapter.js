'use strict';
import { chainlinkClient } from './chainlink.client.js';
export function createOracleRequestAdapter({ client = chainlinkClient } = {}) { return { async request({ job, data, callbackUrl }) { return client.request({ job, data, callbackUrl }); } }; }
export const oracleRequestAdapter = createOracleRequestAdapter();

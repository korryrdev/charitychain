'use strict';

import { ipfsClient } from './ipfs.client.js';

export function createAvailabilityChecker(client = ipfsClient) {
  return async function checkAvailability() {
    try {
      await client.request('/api/v0/id', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  };
}

export const checkIpfsAvailability = createAvailabilityChecker();

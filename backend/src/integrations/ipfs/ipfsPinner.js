'use strict';

import { assertValidCid } from './cidVerifier.js';
import { ipfsClient } from './ipfs.client.js';

export function createIpfsPinner(client = ipfsClient) {
  return async function pin(cid) {
    const value = assertValidCid(cid);
    await client.request(`/api/v0/pin/add?arg=${encodeURIComponent(value)}`, { method: 'POST' });
    return value;
  };
}

export const pinOnIpfs = createIpfsPinner();

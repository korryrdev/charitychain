'use strict';

import { assertValidCid } from './cidVerifier.js';
import { ipfsClient } from './ipfs.client.js';

export function createIpfsRetriever(client = ipfsClient) {
  return async function retrieve(cid) {
    const response = await client.request(`/api/v0/cat?arg=${encodeURIComponent(assertValidCid(cid))}`, { method: 'POST' });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > client.config.maximumBytes) throw new Error('Retrieved IPFS payload exceeds the configured size limit.');
    return bytes;
  };
}

export const retrieveFromIpfs = createIpfsRetriever();

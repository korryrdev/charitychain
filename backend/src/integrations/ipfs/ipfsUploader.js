'use strict';

import { assertValidCid } from './cidVerifier.js';
import { ipfsClient } from './ipfs.client.js';
import { IpfsError } from './ipfs.errors.js';

export function createIpfsUploader(client = ipfsClient) {
  return async function upload(content, filename = 'evidence.enc.json') {
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
    if (bytes.length > client.config.maximumBytes) throw new IpfsError('IPFS payload exceeds the configured size limit.');
    const body = new FormData();
    body.append('file', new Blob([bytes], { type: 'application/octet-stream' }), filename);
    const response = await client.request('/api/v0/add?pin=true&cid-version=1', { method: 'POST', body });
    const lines = (await response.text()).trim().split('\n');
    const result = JSON.parse(lines.at(-1));
    return { cid: assertValidCid(result.Hash), size: Number(result.Size) };
  };
}

export const uploadToIpfs = createIpfsUploader();

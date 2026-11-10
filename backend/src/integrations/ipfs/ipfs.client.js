'use strict';

import { ipfsConfig } from './ipfs.config.js';
import { IpfsError } from './ipfs.errors.js';

export function createIpfsClient({ config = ipfsConfig, fetchImpl = globalThis.fetch } = {}) {
  async function request(path, options = {}) {
    if (!config.enabled) throw new IpfsError('IPFS integration is disabled.');
    const signal = AbortSignal.timeout(config.requestTimeoutMs);
    let response;
    try {
      response = await fetchImpl(`${config.apiUrl.replace(/\/$/, '')}${path}`, { ...options, signal });
    } catch (error) {
      throw new IpfsError('IPFS request failed.', { cause: error });
    }
    if (!response.ok) throw new IpfsError('IPFS returned an unsuccessful response.', { status: response.status });
    return response;
  }
  return { request, config };
}

export const ipfsClient = createIpfsClient();

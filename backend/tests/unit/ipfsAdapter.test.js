import { describe, expect, it, vi } from 'vitest';
import { createIpfsClient } from '../../src/integrations/ipfs/ipfs.client.js';
import { createIpfsPinner } from '../../src/integrations/ipfs/ipfsPinner.js';
import { createIpfsRetriever } from '../../src/integrations/ipfs/ipfsRetriever.js';
import { createIpfsUploader } from '../../src/integrations/ipfs/ipfsUploader.js';

const cid = `bafy${'a'.repeat(56)}`;
const config = { enabled: true, apiUrl: 'http://ipfs.test', requestTimeoutMs: 1000, maximumBytes: 1024 };

describe('IPFS HTTP adapter', () => {
  it('uploads multipart content and validates the returned CID', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ Hash: cid, Size: '7' }), { status: 200 }));
    const upload = createIpfsUploader(createIpfsClient({ config, fetchImpl }));
    await expect(upload('payload')).resolves.toEqual({ cid, size: 7 });
    expect(fetchImpl.mock.calls[0][0]).toContain('/api/v0/add?pin=true&cid-version=1');
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });

  it('retrieves and pins only syntactically valid CIDs', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('encrypted', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const client = createIpfsClient({ config, fetchImpl });
    await expect(createIpfsRetriever(client)(cid)).resolves.toEqual(Buffer.from('encrypted'));
    await expect(createIpfsPinner(client)(cid)).resolves.toBe(cid);
    await expect(createIpfsRetriever(client)('not-a-cid')).rejects.toThrow('Invalid IPFS CID');
  });

  it('fails closed for disabled, oversized and unsuccessful requests', async () => {
    const disabled = createIpfsClient({ config: { ...config, enabled: false }, fetchImpl: vi.fn() });
    await expect(createIpfsUploader(disabled)('payload')).rejects.toThrow('disabled');
    const oversized = createIpfsUploader(createIpfsClient({ config: { ...config, maximumBytes: 2 }, fetchImpl: vi.fn() }));
    await expect(oversized('payload')).rejects.toThrow('size limit');
    const failing = createIpfsClient({ config, fetchImpl: vi.fn().mockResolvedValue(new Response('failed', { status: 500 })) });
    await expect(createIpfsPinner(failing)(cid)).rejects.toThrow('unsuccessful');
  });
});

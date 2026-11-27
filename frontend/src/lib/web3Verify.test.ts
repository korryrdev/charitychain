import { describe, expect, it } from 'vitest';
import type Web3 from 'web3';
import {
  computeDonationId,
  verifyDonationOnChain,
  verifyEvidenceCommitmentOnChain,
  verifyReportOnChain,
} from './web3Verify';

function mockWeb3Factory(methods: Record<string, (...args: any[]) => { call: () => Promise<any> }>) {
  return () =>
    ({
      eth: {
        Contract: class {
          methods = methods;
        },
      },
    }) as unknown as Web3;
}

describe('web3Verify trustless on-chain verification helpers', () => {
  it('returns NOT_CONFIGURED when RPC or contract addresses are omitted', async () => {
    const res = await verifyDonationOnChain(
      { lotId: 'lot-1', recordHash: '0x' + 'aa'.repeat(32) },
      { rpcUrl: '', contractAddress: '' }
    );
    expect(res.status).toBe('NOT_CONFIGURED');

    const rep = await verifyReportOnChain(
      { year: 2026, quarter: 4, version: 1, reportHash: '0x' + 'bb'.repeat(32) },
      { rpcUrl: 'http://127.0.0.1:8545', contractAddress: '' }
    );
    expect(rep.status).toBe('NOT_CONFIGURED');
  });

  it('verifies matching DonationLedger recordHash and detects mismatches / unanchored lots', async () => {
    const hash = '0x' + 'aa'.repeat(32);
    const id = computeDonationId('11111111-1111-4111-8111-111111111111');
    expect(id).toMatch(/^0x[a-f0-9]{64}$/);

    const okRes = await verifyDonationOnChain(
      { lotId: '11111111-1111-4111-8111-111111111111', recordHash: hash },
      {
        rpcUrl: 'http://127.0.0.1:8545',
        contractAddress: '0x1111111111111111111111111111111111111111',
        web3Factory: mockWeb3Factory({
          isRecorded: () => ({ call: async () => true }),
          recordHashOf: () => ({ call: async () => hash }),
          recordedAtOf: () => ({ call: async () => 1760000000n }),
        }),
      }
    );
    expect(okRes.status).toBe('VERIFIED');
    expect(okRes.onChainHash).toBe(hash);

    const mismatchRes = await verifyDonationOnChain(
      { lotId: '11111111-1111-4111-8111-111111111111', recordHash: '0x' + 'ff'.repeat(32) },
      {
        rpcUrl: 'http://127.0.0.1:8545',
        contractAddress: '0x1111111111111111111111111111111111111111',
        web3Factory: mockWeb3Factory({
          isRecorded: () => ({ call: async () => true }),
          recordHashOf: () => ({ call: async () => hash }),
          recordedAtOf: () => ({ call: async () => 1760000000n }),
        }),
      }
    );
    expect(mismatchRes.status).toBe('MISMATCH');

    const unanchoredRes = await verifyDonationOnChain(
      { lotId: '11111111-1111-4111-8111-111111111111', recordHash: hash },
      {
        rpcUrl: 'http://127.0.0.1:8545',
        contractAddress: '0x1111111111111111111111111111111111111111',
        web3Factory: mockWeb3Factory({
          isRecorded: () => ({ call: async () => false }),
        }),
      }
    );
    expect(unanchoredRes.status).toBe('NOT_ANCHORED');
  });

  it('verifies PeriodAnchor reportHash and EvidenceRegistry commitment status', async () => {
    const hash = '0x' + 'cd'.repeat(32);

    const repRes = await verifyReportOnChain(
      { year: 2026, quarter: 4, version: 1, reportHash: hash },
      {
        rpcUrl: 'http://127.0.0.1:8545',
        contractAddress: '0x2222222222222222222222222222222222222222',
        web3Factory: mockWeb3Factory({
          reportHash: () => ({ call: async () => hash }),
          latestReportVersion: () => ({ call: async () => 1n }),
        }),
      }
    );
    expect(repRes.status).toBe('VERIFIED');
    expect(repRes.latestVersion).toBe(1);

    const evRes = await verifyEvidenceCommitmentOnChain(
      { commitment: hash },
      {
        rpcUrl: 'http://127.0.0.1:8545',
        contractAddress: '0x3333333333333333333333333333333333333333',
        web3Factory: mockWeb3Factory({
          isAnchored: () => ({ call: async () => true }),
        }),
      }
    );
    expect(evRes.status).toBe('VERIFIED');
  });
});

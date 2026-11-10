'use strict';

import { describe, it, expect, vi } from 'vitest';
import { computeMerkleRoot, generateMerkleProof, verifyMerkleProof, hashLeaf } from '../../src/utils/merkle.js';
import { createDailyDigestService } from '../../src/modules/auditLogs/dailyDigest.service.js';

describe('G25: Merkle Tree & Daily Ledger Digest (FR-AUD-02, FR-AUD-03, R17)', () => {
  it('computes deterministic Merkle root and validates inclusion proofs', () => {
    const leaves = ['entry-1', 'entry-2', 'entry-3', 'entry-4'].map(hashLeaf);
    const root = computeMerkleRoot(leaves);

    for (let i = 0; i < leaves.length; i++) {
      const proof = generateMerkleProof(leaves, i);
      expect(proof.length).toBe(2);
      const valid = verifyMerkleProof(leaves[i], proof, root);
      expect(valid).toBe(true);
    }
  });

  it('handles odd number of leaves gracefully with duplicate padding', () => {
    const leaves = ['entry-1', 'entry-2', 'entry-3'].map(hashLeaf);
    const root = computeMerkleRoot(leaves);
    const proof = generateMerkleProof(leaves, 2);
    expect(verifyMerkleProof(leaves[2], proof, root)).toBe(true);
  });

  it('computes daily digest over audit events and detects root mismatch (R17)', async () => {
    const mockEvents = [
      { id: 'ev-1', hash: 'hash1', sequence: 1, createdAt: new Date('2026-11-10T08:00:00Z') },
      { id: 'ev-2', hash: 'hash2', sequence: 2, createdAt: new Date('2026-11-10T12:00:00Z') }
    ];

    const mockAlerts = { raiseAlert: vi.fn() };
    const mockDb = {
      auditEvent: {
        findMany: vi.fn().mockResolvedValue(mockEvents)
      },
      outboxEvent: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'outbox-1',
          payload: { merkleRoot: '0xWRONG_ROOT' }
        }),
        create: vi.fn().mockResolvedValue({ id: 'outbox-2' })
      }
    };

    const service = createDailyDigestService({ database: mockDb, alerts: mockAlerts });
    const digest = await service.computeDigest('2026-11-10');

    expect(digest.day).toBe(20261110);
    expect(digest.entryCount).toBe(2);
    expect(digest.merkleRoot).toMatch(/^0x[a-f0-9]{64}$/);
    expect(mockAlerts.raiseAlert).toHaveBeenCalledWith(
      expect.objectContaining({ ruleId: 'R17', severity: 'CRITICAL' })
    );
  });
});

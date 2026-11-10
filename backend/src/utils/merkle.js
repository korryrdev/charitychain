'use strict';

import { createHash } from 'node:crypto';

export function hashLeaf(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  return createHash('sha256').update(buf).digest();
}

export function hashPair(a, b) {
  return createHash('sha256').update(Buffer.concat([a, b])).digest();
}

export function computeMerkleRoot(leaves) {
  if (!leaves || leaves.length === 0) {
    return createHash('sha256').update('EMPTY').digest();
  }
  let current = leaves.map((leaf) => (Buffer.isBuffer(leaf) ? leaf : hashLeaf(leaf)));
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        next.push(hashPair(current[i], current[i + 1]));
      } else {
        next.push(hashPair(current[i], current[i]));
      }
    }
    current = next;
  }
  return current[0];
}

export function generateMerkleProof(leaves, targetIndex) {
  if (!leaves || leaves.length === 0 || targetIndex < 0 || targetIndex >= leaves.length) {
    return [];
  }
  let current = leaves.map((leaf) => (Buffer.isBuffer(leaf) ? leaf : hashLeaf(leaf)));
  let idx = targetIndex;
  const proof = [];

  while (current.length > 1) {
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    const sibling = siblingIdx < current.length ? current[siblingIdx] : current[idx];

    proof.push({
      position: isRight ? 'left' : 'right',
      data: '0x' + sibling.toString('hex')
    });

    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        next.push(hashPair(current[i], current[i + 1]));
      } else {
        next.push(hashPair(current[i], current[i]));
      }
    }
    current = next;
    idx = Math.floor(idx / 2);
  }

  return proof;
}

export function verifyMerkleProof(leaf, proof, expectedRoot) {
  let hash = Buffer.isBuffer(leaf) ? leaf : hashLeaf(leaf);
  for (const step of proof) {
    const sibling = Buffer.from(step.data.replace(/^0x/, ''), 'hex');
    hash = step.position === 'left' ? hashPair(sibling, hash) : hashPair(hash, sibling);
  }
  const rootHex = Buffer.isBuffer(expectedRoot)
    ? expectedRoot.toString('hex')
    : expectedRoot.replace(/^0x/, '');
  return hash.toString('hex') === rootHex;
}


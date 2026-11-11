'use strict';

import { createHash } from 'node:crypto';

function digest(value) {
  return `0x${createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

export const commitmentBuilderService = Object.freeze({
  build(evidence, previousCommitment = null) {
    const subjectKey = digest(`${evidence.subjectType}:${evidence.subjectId}:${evidence.evidenceType}`);
    const canonical = JSON.stringify({
      schemaVersion: '1.0', subjectKey, evidenceDigest: evidence.canonicalDigest,
      ipfsCid: evidence.ipfsCid ?? null, evidenceVersion: evidence.version,
      previousCommitment: previousCommitment ?? null
    });
    return { subjectKey, commitment: digest(canonical), previousCommitment: previousCommitment ?? null };
  }
});

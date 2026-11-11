'use strict';

import { createHash } from 'node:crypto';

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

export function canonicalizeEvidence(value) {
  return JSON.stringify(normalize(value));
}

export function digestEvidence(canonical) {
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export const canonicalEvidenceService = Object.freeze({
  create({ subjectType, subjectId, evidenceType, content }) {
    const document = { schemaVersion: '1.0', subjectType, subjectId, evidenceType, content };
    const canonical = canonicalizeEvidence(document);
    return { document, canonical, digest: digestEvidence(canonical) };
  },
  verify(canonical, digest) {
    return digestEvidence(canonical) === digest;
  }
});

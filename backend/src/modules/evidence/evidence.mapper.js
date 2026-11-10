'use strict';

export function mapEvidence(record, content) {
  return {
    id: record.id, reference: record.reference, subjectType: record.subjectType,
    subjectId: record.subjectId, evidenceType: record.evidenceType,
    sensitivity: record.sensitivity, status: record.status, version: record.version,
    canonicalDigest: record.canonicalDigest, ipfsCid: record.ipfsCid,
    ipfsPinnedAt: record.ipfsPinnedAt, retainedUntil: record.retainedUntil,
    lastVerifiedAt: record.lastVerifiedAt, expiredAt: record.expiredAt,
    destroyedAt: record.destroyedAt, createdAt: record.createdAt,
    ...(content === undefined ? {} : { content })
  };
}

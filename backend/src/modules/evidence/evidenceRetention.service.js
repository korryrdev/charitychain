'use strict';

const DAY_MS = 86_400_000;
export const EVIDENCE_RETENTION = Object.freeze({ defaultDays: 2555, minimumDays: 30, maximumDays: 3650 });

export const evidenceRetentionService = Object.freeze({
  retainedUntil(days = EVIDENCE_RETENTION.defaultDays, now = new Date()) {
    if (!Number.isInteger(days) || days < EVIDENCE_RETENTION.minimumDays || days > EVIDENCE_RETENTION.maximumDays) throw new RangeError('Evidence retention period is outside policy.');
    return new Date(now.getTime() + days * DAY_MS);
  },
  canDestroy(record, now = new Date()) {
    return record.status === 'EXPIRED' && record.retainedUntil <= now && !record.destroyedAt;
  }
});

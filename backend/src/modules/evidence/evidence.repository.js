'use strict';

import { prisma } from '@charitychain/database';

const subjectDelegates = Object.freeze({
  DONATION: 'moneyDonation', DISBURSEMENT: 'disbursement', GOODS_COLLECTION: 'goodsCollection',
  APPLICATION: 'assistanceApplication', VETTING: 'vettingRun', RECONCILIATION: 'reconciliationRun'
});

export function createEvidenceRepository(database = prisma) {
  return {
    subjectExists(subjectType, subjectId) {
      return database[subjectDelegates[subjectType]].findUnique({ where: { id: subjectId }, select: { id: true } });
    },
    async nextVersion(subjectType, subjectId, evidenceType) {
      const result = await database.evidenceRecord.aggregate({
        where: { subjectType, subjectId, evidenceType }, _max: { version: true }
      });
      return (result._max.version ?? 0) + 1;
    },
    create(data) { return database.evidenceRecord.create({ data }); },
    find(id) { return database.evidenceRecord.findUnique({ where: { id } }); },
    listForSubject(subjectType, subjectId) {
      return database.evidenceRecord.findMany({ where: { subjectType, subjectId }, orderBy: [{ evidenceType: 'asc' }, { version: 'desc' }] });
    },
    markVerified(id) { return database.evidenceRecord.update({ where: { id }, data: { lastVerifiedAt: new Date(), status: 'ACTIVE' } }); },
    markIntegrityFailed(id) { return database.evidenceRecord.update({ where: { id }, data: { lastVerifiedAt: new Date(), status: 'INTEGRITY_FAILED' } }); },
    expireDue(now) { return database.evidenceRecord.updateMany({ where: { status: 'ACTIVE', retainedUntil: { lte: now } }, data: { status: 'EXPIRED', expiredAt: now } }); },
    destroy(id, now) { return database.evidenceRecord.update({ where: { id }, data: { status: 'DESTROYED', encryptedContent: '', destroyedAt: now } }); }
  };
}

export const evidenceRepository = createEvidenceRepository();

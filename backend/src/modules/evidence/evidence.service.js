'use strict';

import { randomBytes } from 'node:crypto';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { IpfsError } from '../../integrations/ipfs/ipfs.errors.js';
import { retrieveFromIpfs } from '../../integrations/ipfs/ipfsRetriever.js';
import { uploadToIpfs } from '../../integrations/ipfs/ipfsUploader.js';
import { canonicalEvidenceService } from './canonicalEvidence.service.js';
import { evidenceEncryptionService } from './evidenceEncryption.service.js';
import { mapEvidence } from './evidence.mapper.js';
import { assertCanManageEvidence, assertCanReadEvidence } from './evidence.policy.js';
import { evidenceRepository } from './evidence.repository.js';
import { evidenceRetentionService } from './evidenceRetention.service.js';

const compatibleTypes = Object.freeze({
  DONATION: ['DONATION_RECEIPT'], DISBURSEMENT: ['DISBURSEMENT_RECEIPT'],
  GOODS_COLLECTION: ['GOODS_HANDOVER'], APPLICATION: ['APPLICATION_DECISION'],
  VETTING: ['VETTING_DECISION'], RECONCILIATION: ['RECONCILIATION_REPORT']
});

function notFound() {
  return new AppError({ message: 'Evidence record not found.', code: ERROR_CODES.RESOURCE_NOT_FOUND, statusCode: 404 });
}

function integrationFailure(error) {
  return new AppError({ message: 'Encrypted evidence could not be stored or retrieved from IPFS.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 503, cause: error });
}

function storedEnvelope(record) {
  return {
    algorithm: 'aes-256-gcm', version: record.encryptionVersion,
    ciphertext: record.encryptedContent, iv: record.encryptionIv,
    authTag: record.encryptionAuthTag, digest: record.canonicalDigest
  };
}

export function createEvidenceService({
  repository = evidenceRepository, encryption = evidenceEncryptionService,
  uploader = uploadToIpfs, retriever = retrieveFromIpfs,
  retention = evidenceRetentionService
} = {}) {
  return {
    async create(auth, input) {
      assertCanManageEvidence(auth);
      if (!compatibleTypes[input.subjectType].includes(input.evidenceType)) {
        throw new AppError({ message: 'Evidence type is incompatible with its subject.', code: ERROR_CODES.VALIDATION_FAILED, statusCode: 422 });
      }
      if (!await repository.subjectExists(input.subjectType, input.subjectId)) throw notFound();
      const generated = canonicalEvidenceService.create(input);
      const encrypted = encryption.encrypt(generated.canonical, generated.digest);
      const envelope = { ...encrypted, digest: generated.digest };
      let uploaded;
      try {
        uploaded = await uploader(JSON.stringify(envelope), `${input.evidenceType.toLowerCase()}.enc.json`);
      } catch (error) {
        throw integrationFailure(error);
      }
      const version = await repository.nextVersion(input.subjectType, input.subjectId, input.evidenceType);
      try {
        const record = await repository.create({
          reference: `EVD-${new Date().getUTCFullYear()}-${randomBytes(8).toString('hex').toUpperCase()}`,
          subjectType: input.subjectType, subjectId: input.subjectId,
          evidenceType: input.evidenceType, sensitivity: input.sensitivity,
          version, canonicalDigest: generated.digest, encryptedContent: encrypted.ciphertext,
          encryptionIv: encrypted.iv, encryptionAuthTag: encrypted.authTag,
          encryptionVersion: encrypted.version, ipfsCid: uploaded.cid, ipfsPinnedAt: new Date(),
          retainedUntil: retention.retainedUntil(input.retentionDays), createdByUserId: auth.user.id
        });
        return mapEvidence(record);
      } catch (error) {
        if (error.code === 'P2002') throw new AppError({ message: 'A concurrent evidence version already exists.', code: ERROR_CODES.CONFLICT, statusCode: 409, cause: error });
        throw error;
      }
    },
    async get(auth, id) {
      assertCanReadEvidence(auth);
      const record = await repository.find(id);
      if (!record) throw notFound();
      if (record.status === 'DESTROYED') return mapEvidence(record, null);
      const canonical = encryption.decrypt(storedEnvelope(record), record.canonicalDigest);
      if (!canonicalEvidenceService.verify(canonical, record.canonicalDigest)) {
        await repository.markIntegrityFailed(record.id);
        throw new AppError({ message: 'Evidence integrity verification failed.', code: ERROR_CODES.RECONCILIATION_MISMATCH, statusCode: 409 });
      }
      return mapEvidence(record, JSON.parse(canonical));
    },
    async list(auth, subjectType, subjectId) {
      assertCanReadEvidence(auth);
      return (await repository.listForSubject(subjectType, subjectId)).map((record) => mapEvidence(record));
    },
    async verify(auth, id) {
      assertCanReadEvidence(auth);
      const record = await repository.find(id);
      if (!record) throw notFound();
      if (record.status === 'DESTROYED' || !record.ipfsCid) return { verified: false, reason: 'EVIDENCE_CONTENT_UNAVAILABLE' };
      let remote;
      try {
        remote = JSON.parse((await retriever(record.ipfsCid)).toString('utf8'));
      } catch (error) {
        if (error instanceof IpfsError) throw integrationFailure(error);
        await repository.markIntegrityFailed(record.id);
        return { verified: false, reason: 'IPFS_CONTENT_INVALID' };
      }
      try {
        const local = storedEnvelope(record);
        const envelopeMatches = ['version', 'ciphertext', 'iv', 'authTag', 'digest'].every((key) => remote[key] === local[key]);
        const canonical = encryption.decrypt(remote, record.canonicalDigest);
        const verified = envelopeMatches && canonicalEvidenceService.verify(canonical, record.canonicalDigest);
        const updated = verified ? await repository.markVerified(id) : await repository.markIntegrityFailed(id);
        return { verified, reason: verified ? null : 'INTEGRITY_MISMATCH', evidence: mapEvidence(updated) };
      } catch {
        const updated = await repository.markIntegrityFailed(id);
        return { verified: false, reason: 'DECRYPTION_FAILED', evidence: mapEvidence(updated) };
      }
    },
    async expireDue(auth, now = new Date()) {
      assertCanManageEvidence(auth);
      return repository.expireDue(now);
    },
    async destroy(auth, id, now = new Date()) {
      assertCanManageEvidence(auth);
      const record = await repository.find(id);
      if (!record) throw notFound();
      if (!retention.canDestroy(record, now)) throw new AppError({ message: 'Evidence cannot be destroyed before its retention obligation ends.', code: ERROR_CODES.CONFLICT, statusCode: 409 });
      return mapEvidence(await repository.destroy(id, now));
    }
  };
}

export const evidenceService = createEvidenceService();

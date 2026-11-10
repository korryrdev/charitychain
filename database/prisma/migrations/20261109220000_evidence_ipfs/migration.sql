CREATE TYPE "EvidenceSubjectType" AS ENUM ('DONATION', 'DISBURSEMENT', 'GOODS_COLLECTION', 'APPLICATION', 'VETTING', 'RECONCILIATION');
CREATE TYPE "EvidenceType" AS ENUM ('DONATION_RECEIPT', 'DISBURSEMENT_RECEIPT', 'GOODS_HANDOVER', 'APPLICATION_DECISION', 'VETTING_DECISION', 'RECONCILIATION_REPORT');
CREATE TYPE "EvidenceSensitivity" AS ENUM ('INTERNAL', 'RESTRICTED');
CREATE TYPE "EvidenceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DESTROYED', 'INTEGRITY_FAILED');

CREATE TABLE "evidence_records" (
  "id" UUID NOT NULL,
  "reference" TEXT NOT NULL,
  "subjectType" "EvidenceSubjectType" NOT NULL,
  "subjectId" UUID NOT NULL,
  "evidenceType" "EvidenceType" NOT NULL,
  "sensitivity" "EvidenceSensitivity" NOT NULL DEFAULT 'RESTRICTED',
  "status" "EvidenceStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "canonicalDigest" TEXT NOT NULL,
  "encryptedContent" TEXT NOT NULL,
  "encryptionIv" TEXT NOT NULL,
  "encryptionAuthTag" TEXT NOT NULL,
  "encryptionVersion" TEXT NOT NULL DEFAULT 'v1',
  "ipfsCid" TEXT,
  "ipfsPinnedAt" TIMESTAMP(3),
  "retainedUntil" TIMESTAMP(3) NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "lastVerifiedAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "destroyedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "evidence_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "evidence_records_version_check" CHECK ("version" > 0),
  CONSTRAINT "evidence_records_retention_check" CHECK ("retainedUntil" > "createdAt"),
  CONSTRAINT "evidence_records_destroyed_payload_check" CHECK ("status" <> 'DESTROYED' OR ("destroyedAt" IS NOT NULL AND "encryptedContent" = ''))
);

CREATE UNIQUE INDEX "evidence_records_reference_key" ON "evidence_records"("reference");
CREATE UNIQUE INDEX "evidence_records_subjectType_subjectId_evidenceType_version_key" ON "evidence_records"("subjectType", "subjectId", "evidenceType", "version");
CREATE INDEX "evidence_records_subjectType_subjectId_status_idx" ON "evidence_records"("subjectType", "subjectId", "status");
CREATE INDEX "evidence_records_status_retainedUntil_idx" ON "evidence_records"("status", "retainedUntil");
CREATE INDEX "evidence_records_canonicalDigest_idx" ON "evidence_records"("canonicalDigest");

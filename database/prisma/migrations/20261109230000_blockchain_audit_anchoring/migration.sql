CREATE TYPE "BlockchainAnchorStatus" AS ENUM ('QUEUED', 'SUBMITTED', 'CONFIRMED', 'FAILED');

CREATE TABLE "blockchain_anchors" (
  "id" UUID NOT NULL,
  "reference" TEXT NOT NULL,
  "evidenceId" UUID NOT NULL,
  "commitment" TEXT NOT NULL,
  "subjectKey" TEXT NOT NULL,
  "previousCommitment" TEXT,
  "status" "BlockchainAnchorStatus" NOT NULL DEFAULT 'QUEUED',
  "network" TEXT NOT NULL,
  "contractAddress" TEXT,
  "transactionHash" TEXT,
  "blockNumber" BIGINT,
  "confirmations" INTEGER NOT NULL DEFAULT 0,
  "requiredConfirmations" INTEGER NOT NULL DEFAULT 2,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "queuedByUserId" UUID NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "blockchain_anchors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "blockchain_anchors_commitment_check" CHECK ("commitment" ~ '^0x[0-9a-f]{64}$'),
  CONSTRAINT "blockchain_anchors_subject_key_check" CHECK ("subjectKey" ~ '^0x[0-9a-f]{64}$'),
  CONSTRAINT "blockchain_anchors_previous_check" CHECK ("previousCommitment" IS NULL OR "previousCommitment" ~ '^0x[0-9a-f]{64}$'),
  CONSTRAINT "blockchain_anchors_confirmations_check" CHECK ("confirmations" >= 0 AND "requiredConfirmations" > 0),
  CONSTRAINT "blockchain_anchors_attempt_count_check" CHECK ("attemptCount" >= 0)
);

CREATE TABLE "blockchain_anchor_attempts" (
  "id" UUID NOT NULL,
  "anchorId" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" "BlockchainAnchorStatus" NOT NULL,
  "transactionHash" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "blockchain_anchor_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "blockchain_anchor_attempt_sequence_check" CHECK ("sequence" > 0)
);

CREATE UNIQUE INDEX "blockchain_anchors_reference_key" ON "blockchain_anchors"("reference");
CREATE UNIQUE INDEX "blockchain_anchors_evidenceId_key" ON "blockchain_anchors"("evidenceId");
CREATE UNIQUE INDEX "blockchain_anchors_commitment_key" ON "blockchain_anchors"("commitment");
CREATE UNIQUE INDEX "blockchain_anchors_transactionHash_key" ON "blockchain_anchors"("transactionHash");
CREATE INDEX "blockchain_anchors_status_createdAt_idx" ON "blockchain_anchors"("status", "createdAt");
CREATE INDEX "blockchain_anchors_subjectKey_createdAt_idx" ON "blockchain_anchors"("subjectKey", "createdAt");
CREATE UNIQUE INDEX "blockchain_anchor_attempts_anchorId_sequence_key" ON "blockchain_anchor_attempts"("anchorId", "sequence");
CREATE INDEX "blockchain_anchor_attempts_status_startedAt_idx" ON "blockchain_anchor_attempts"("status", "startedAt");

ALTER TABLE "blockchain_anchors" ADD CONSTRAINT "blockchain_anchors_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blockchain_anchor_attempts" ADD CONSTRAINT "blockchain_anchor_attempts_anchorId_fkey" FOREIGN KEY ("anchorId") REFERENCES "blockchain_anchors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

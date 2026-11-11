CREATE TYPE "ApprovalRoundStatus" AS ENUM ('OPEN', 'APPROVED', 'DECLINED', 'INVALIDATED');
CREATE TYPE "ApprovalDecisionType" AS ENUM ('APPROVE', 'DECLINE');

CREATE TABLE "approval_rounds" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "applicationVersion" INTEGER NOT NULL,
  "evidenceDigest" TEXT NOT NULL,
  "threshold" INTEGER NOT NULL DEFAULT 2,
  "status" "ApprovalRoundStatus" NOT NULL DEFAULT 'OPEN',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "invalidationReason" TEXT,
  CONSTRAINT "approval_rounds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approval_rounds_threshold_check" CHECK ("threshold" = 2)
);

CREATE TABLE "approval_decisions" (
  "id" UUID NOT NULL,
  "roundId" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  "decision" "ApprovalDecisionType" NOT NULL,
  "digest" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "approval_rounds_applicationId_sequence_key" ON "approval_rounds"("applicationId", "sequence");
CREATE INDEX "approval_rounds_applicationId_status_idx" ON "approval_rounds"("applicationId", "status");
CREATE UNIQUE INDEX "approval_rounds_one_open_per_application" ON "approval_rounds"("applicationId") WHERE "status" = 'OPEN';
CREATE UNIQUE INDEX "approval_decisions_roundId_membershipId_key" ON "approval_decisions"("roundId", "membershipId");
CREATE INDEX "approval_decisions_roundId_decision_idx" ON "approval_decisions"("roundId", "decision");

ALTER TABLE "approval_rounds" ADD CONSTRAINT "approval_rounds_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "assistance_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "approval_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "committee_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

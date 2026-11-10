CREATE TYPE "ForensicRuleCode" AS ENUM ('UNRECONCILED_MONEY', 'DUPLICATE_CALLBACK', 'REPEATED_CONFIRMATION_FAILURE', 'INVENTORY_VARIANCE', 'DISBURSEMENT_SPIKE', 'APPROVAL_CONFLICT', 'UNUSUAL_CLERK_ACTIVITY');
CREATE TYPE "ForensicSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ForensicAnomalyStatus" AS ENUM ('DETECTED', 'TRIAGED', 'INVESTIGATING', 'CONFIRMED', 'DISMISSED', 'RESOLVED');
CREATE TYPE "ForensicInvestigationStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "forensic_anomalies" (
  "id" UUID NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "ruleCode" "ForensicRuleCode" NOT NULL,
  "severity" "ForensicSeverity" NOT NULL,
  "status" "ForensicAnomalyStatus" NOT NULL DEFAULT 'DETECTED',
  "sourceType" TEXT,
  "sourceId" TEXT,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "triagedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "forensic_anomalies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "forensic_anomalies_occurrence_check" CHECK ("occurrenceCount" > 0)
);

CREATE TABLE "forensic_investigations" (
  "id" UUID NOT NULL,
  "anomalyId" UUID NOT NULL,
  "status" "ForensicInvestigationStatus" NOT NULL DEFAULT 'OPEN',
  "assignedToUserId" UUID,
  "openedByUserId" UUID NOT NULL,
  "findings" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "conclusion" TEXT,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "forensic_investigations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "forensic_anomalies_fingerprint_key" ON "forensic_anomalies"("fingerprint");
CREATE INDEX "forensic_anomalies_status_severity_detectedAt_idx" ON "forensic_anomalies"("status", "severity", "detectedAt");
CREATE INDEX "forensic_anomalies_ruleCode_lastSeenAt_idx" ON "forensic_anomalies"("ruleCode", "lastSeenAt");
CREATE INDEX "forensic_anomalies_sourceType_sourceId_idx" ON "forensic_anomalies"("sourceType", "sourceId");
CREATE UNIQUE INDEX "forensic_investigations_anomalyId_key" ON "forensic_investigations"("anomalyId");
CREATE INDEX "forensic_investigations_status_openedAt_idx" ON "forensic_investigations"("status", "openedAt");
ALTER TABLE "forensic_investigations" ADD CONSTRAINT "forensic_investigations_anomalyId_fkey" FOREIGN KEY ("anomalyId") REFERENCES "forensic_anomalies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

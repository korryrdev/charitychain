CREATE TYPE "VettingOutcome" AS ENUM ('RUNNING', 'VERIFIED', 'MANUAL_REVIEW', 'INELIGIBLE', 'FAILED');
CREATE TYPE "VettingFactor" AS ENUM ('MICRO_PAYMENT', 'EXAM_PERIOD_PAYMENT', 'FINANCE_BLOCK', 'AID_RELIANCE', 'UNMET_BALANCE', 'PREVIOUS_ASSISTANCE', 'DUPLICATE_APPLICATION');
CREATE TYPE "VettingFactorOutcome" AS ENUM ('PASS', 'PARTIAL', 'FAIL', 'WARNING');

CREATE TABLE "vetting_policies" (
  "id" UUID NOT NULL,
  "version" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "configuration" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vetting_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vetting_runs" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "policyId" UUID NOT NULL,
  "status" "VettingOutcome" NOT NULL DEFAULT 'RUNNING',
  "score" DECIMAL(5,2),
  "inputDigest" TEXT NOT NULL,
  "explanation" TEXT,
  "flags" JSONB,
  "executedByUserId" UUID,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "vetting_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vetting_factor_results" (
  "id" UUID NOT NULL,
  "vettingRunId" UUID NOT NULL,
  "factor" "VettingFactor" NOT NULL,
  "outcome" "VettingFactorOutcome" NOT NULL,
  "points" DECIMAL(5,2) NOT NULL,
  "maximumPoints" DECIMAL(5,2) NOT NULL,
  "rawValue" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  "explanation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vetting_factor_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vetting_policies_version_key" ON "vetting_policies"("version");
CREATE INDEX "vetting_policies_active_createdAt_idx" ON "vetting_policies"("active", "createdAt");
CREATE UNIQUE INDEX "vetting_runs_applicationId_policyId_inputDigest_key" ON "vetting_runs"("applicationId", "policyId", "inputDigest");
CREATE INDEX "vetting_runs_applicationId_startedAt_idx" ON "vetting_runs"("applicationId", "startedAt");
CREATE INDEX "vetting_runs_status_completedAt_idx" ON "vetting_runs"("status", "completedAt");
CREATE UNIQUE INDEX "vetting_factor_results_vettingRunId_factor_key" ON "vetting_factor_results"("vettingRunId", "factor");
CREATE INDEX "vetting_factor_results_factor_outcome_idx" ON "vetting_factor_results"("factor", "outcome");

ALTER TABLE "vetting_runs" ADD CONSTRAINT "vetting_runs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "assistance_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vetting_runs" ADD CONSTRAINT "vetting_runs_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "vetting_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vetting_factor_results" ADD CONSTRAINT "vetting_factor_results_vettingRunId_fkey" FOREIGN KEY ("vettingRunId") REFERENCES "vetting_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "vetting_policies" ("id", "version", "name", "configuration", "active") VALUES (
  '16161616-1616-4161-8161-161616161616',
  'need-index-v1',
  'Need Index Policy v1',
  '{"weights":{"microPayment":25,"examPeriodPayment":15,"financeBlock":15,"aidReliance":15,"unmetBalance":30},"penalties":{"previousAssistancePerRecord":5,"maximumPreviousAssistance":10},"thresholds":{"verifiedScore":70,"manualReviewScore":45,"microPaymentMaximum":5000,"minimumMicroPayments":3,"examPaymentWindowDays":3,"examPaymentOccurrencesForFullScore":2,"financeBlocksForFullScore":2,"balanceRatioForFullScore":0.5,"previousAssistanceLookbackRecords":2}}'::jsonb,
  true
);

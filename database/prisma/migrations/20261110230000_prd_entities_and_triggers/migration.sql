-- CreateTable
CREATE TABLE "subgroups" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repUserId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subgroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "subGroupId" UUID NOT NULL,
    "studentIdentifierHash" TEXT NOT NULL,
    "encryptedStudentData" TEXT,
    "needCategory" TEXT NOT NULL,
    "requestedAmountMinor" BIGINT NOT NULL,
    "approvedAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "disbursedAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "caseHash" TEXT,
    "decisionHash" TEXT,
    "justification" TEXT NOT NULL,
    "hasConsent" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_events" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "actorUserId" UUID,
    "notes" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_approvals" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "approverUserId" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "amountMinor" BIGINT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" UUID NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "sourceRefHash" TEXT NOT NULL,
    "donorRef" TEXT NOT NULL,
    "totalAmountMinor" BIGINT NOT NULL,
    "remainingAmountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "channel" TEXT NOT NULL,
    "earmark" TEXT,
    "isExhausted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" UUID NOT NULL,
    "lotId" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_raw_callbacks" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalTransactionId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_raw_callbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_deposits" (
    "id" UUID NOT NULL,
    "depositReference" TEXT NOT NULL,
    "donorRef" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "fxRate" DECIMAL(12,6),
    "convertedAmountMinor" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "enteredByUserId" UUID NOT NULL,
    "verifiedByUserId" UUID,
    "consentVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "bank_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_lines" (
    "id" UUID NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "matchedDepositId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_reports" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reportHash" TEXT NOT NULL,
    "periodRoot" TEXT NOT NULL,
    "canonicalJson" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "txHash" TEXT,
    "isAnchored" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "period_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forensic_alerts" (
    "id" UUID NOT NULL,
    "ruleId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forensic_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forensic_alert_events" (
    "id" UUID NOT NULL,
    "alertId" UUID NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorUserId" UUID,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forensic_alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forensic_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "thresholdParams" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forensic_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_preference_events" (
    "id" UUID NOT NULL,
    "donorRef" TEXT NOT NULL,
    "displayMode" TEXT NOT NULL,
    "publicAlias" TEXT,
    "confirmedName" TEXT,
    "consentVersion" TEXT NOT NULL,
    "isOptedIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donor_preference_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_badges" (
    "id" UUID NOT NULL,
    "donorRef" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "donor_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subgroups_code_key" ON "subgroups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseNumber_key" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_subGroupId_state_idx" ON "cases"("subGroupId", "state");

-- CreateIndex
CREATE INDEX "cases_caseNumber_idx" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "case_events_caseId_createdAt_idx" ON "case_events"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "case_approvals_caseId_idx" ON "case_approvals"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "lots_receiptCode_key" ON "lots"("receiptCode");

-- CreateIndex
CREATE INDEX "lots_donorRef_idx" ON "lots"("donorRef");

-- CreateIndex
CREATE INDEX "lots_receiptCode_idx" ON "lots"("receiptCode");

-- CreateIndex
CREATE INDEX "lots_isExhausted_createdAt_idx" ON "lots"("isExhausted", "createdAt");

-- CreateIndex
CREATE INDEX "allocations_lotId_idx" ON "allocations"("lotId");

-- CreateIndex
CREATE INDEX "allocations_caseId_idx" ON "allocations"("caseId");

-- CreateIndex
CREATE INDEX "donation_raw_callbacks_externalTransactionId_idx" ON "donation_raw_callbacks"("externalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_deposits_depositReference_key" ON "bank_deposits"("depositReference");

-- CreateIndex
CREATE INDEX "bank_deposits_depositReference_idx" ON "bank_deposits"("depositReference");

-- CreateIndex
CREATE INDEX "bank_deposits_status_idx" ON "bank_deposits"("status");

-- CreateIndex
CREATE INDEX "bank_statement_lines_reference_idx" ON "bank_statement_lines"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "period_reports_year_quarter_version_key" ON "period_reports"("year", "quarter", "version");

-- CreateIndex
CREATE INDEX "forensic_alerts_status_riskScore_idx" ON "forensic_alerts"("status", "riskScore");

-- CreateIndex
CREATE INDEX "forensic_alerts_ruleId_idx" ON "forensic_alerts"("ruleId");

-- CreateIndex
CREATE INDEX "forensic_alert_events_alertId_idx" ON "forensic_alert_events"("alertId");

-- CreateIndex
CREATE INDEX "donor_preference_events_donorRef_idx" ON "donor_preference_events"("donorRef");

-- CreateIndex
CREATE INDEX "donor_badges_donorRef_idx" ON "donor_badges"("donorRef");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_subGroupId_fkey" FOREIGN KEY ("subGroupId") REFERENCES "subgroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_approvals" ADD CONSTRAINT "case_approvals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forensic_alert_events" ADD CONSTRAINT "forensic_alert_events_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "forensic_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Append-only DB triggers (G05, PRD Section 10.1)
CREATE OR REPLACE FUNCTION prevent_append_only_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only and cannot be updated or deleted', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_events_append_only
BEFORE UPDATE OR DELETE ON "case_events"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();

CREATE TRIGGER allocations_append_only
BEFORE UPDATE OR DELETE ON "allocations"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();

CREATE TRIGGER donation_raw_callbacks_append_only
BEFORE UPDATE OR DELETE ON "donation_raw_callbacks"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();


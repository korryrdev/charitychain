ALTER TABLE "disbursements" ADD COLUMN "reconciledAt" TIMESTAMP(3);
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET','LIABILITY','INCOME','EXPENSE','EQUITY');
CREATE TYPE "LedgerSourceType" AS ENUM ('DONATION','DISBURSEMENT');
CREATE TYPE "LedgerJournalStatus" AS ENUM ('POSTED','REVERSED');
CREATE TYPE "ReconciliationScope" AS ENUM ('DONATIONS','DISBURSEMENTS','ALL');
CREATE TYPE "ReconciliationRunStatus" AS ENUM ('RUNNING','COMPLETED','COMPLETED_WITH_EXCEPTIONS','FAILED');
CREATE TYPE "ReconciliationOutcome" AS ENUM ('MATCHED','MISSING_PROVIDER_EVENT','AMOUNT_MISMATCH','MISSING_TRANSACTION_REFERENCE','DUPLICATE_REFERENCE');
CREATE TABLE "ledger_accounts" ("id" UUID NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"type" "LedgerAccountType" NOT NULL,"currency" TEXT NOT NULL DEFAULT 'KES',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ledger_journals" ("id" UUID NOT NULL,"reference" TEXT NOT NULL,"sourceType" "LedgerSourceType" NOT NULL,"sourceId" UUID NOT NULL,"status" "LedgerJournalStatus" NOT NULL DEFAULT 'POSTED',"description" TEXT NOT NULL,"currency" TEXT NOT NULL DEFAULT 'KES',"totalDebit" DECIMAL(18,2) NOT NULL,"totalCredit" DECIMAL(18,2) NOT NULL,"postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"reversedAt" TIMESTAMP(3),CONSTRAINT "ledger_journals_pkey" PRIMARY KEY ("id"),CONSTRAINT "ledger_journals_balanced_check" CHECK ("totalDebit" = "totalCredit" AND "totalDebit" > 0));
CREATE TABLE "ledger_entries" ("id" UUID NOT NULL,"journalId" UUID NOT NULL,"accountId" UUID NOT NULL,"debit" DECIMAL(18,2) NOT NULL DEFAULT 0,"credit" DECIMAL(18,2) NOT NULL DEFAULT 0,"memo" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id"),CONSTRAINT "ledger_entries_one_side_check" CHECK (("debit" > 0 AND "credit" = 0) OR ("credit" > 0 AND "debit" = 0)));
CREATE TABLE "reconciliation_runs" ("id" UUID NOT NULL,"reference" TEXT NOT NULL,"scope" "ReconciliationScope" NOT NULL,"status" "ReconciliationRunStatus" NOT NULL DEFAULT 'RUNNING',"periodStart" TIMESTAMP(3) NOT NULL,"periodEnd" TIMESTAMP(3) NOT NULL,"startedByUserId" UUID NOT NULL,"matchedCount" INTEGER NOT NULL DEFAULT 0,"exceptionCount" INTEGER NOT NULL DEFAULT 0,"matchedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,"startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"completedAt" TIMESTAMP(3),"failureMessage" TEXT,CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id"),CONSTRAINT "reconciliation_runs_period_check" CHECK ("periodEnd" > "periodStart"));
CREATE TABLE "reconciliation_items" ("id" UUID NOT NULL,"runId" UUID NOT NULL,"sourceType" "LedgerSourceType" NOT NULL,"sourceId" UUID NOT NULL,"provider" TEXT NOT NULL,"providerReference" TEXT,"internalAmount" DECIMAL(18,2) NOT NULL,"providerAmount" DECIMAL(18,2),"outcome" "ReconciliationOutcome" NOT NULL,"details" JSONB NOT NULL,"ledgerJournalId" UUID,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "ledger_accounts"("code");
CREATE UNIQUE INDEX "ledger_journals_reference_key" ON "ledger_journals"("reference");
CREATE UNIQUE INDEX "ledger_journals_sourceType_sourceId_key" ON "ledger_journals"("sourceType","sourceId");
CREATE INDEX "ledger_journals_status_postedAt_idx" ON "ledger_journals"("status","postedAt");
CREATE INDEX "ledger_entries_accountId_createdAt_idx" ON "ledger_entries"("accountId","createdAt");
CREATE INDEX "ledger_entries_journalId_idx" ON "ledger_entries"("journalId");
CREATE UNIQUE INDEX "reconciliation_runs_reference_key" ON "reconciliation_runs"("reference");
CREATE INDEX "reconciliation_runs_status_startedAt_idx" ON "reconciliation_runs"("status","startedAt");
CREATE UNIQUE INDEX "reconciliation_items_runId_sourceType_sourceId_key" ON "reconciliation_items"("runId","sourceType","sourceId");
CREATE INDEX "reconciliation_items_outcome_createdAt_idx" ON "reconciliation_items"("outcome","createdAt");
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "ledger_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_runId_fkey" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_ledgerJournalId_fkey" FOREIGN KEY ("ledgerJournalId") REFERENCES "ledger_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
INSERT INTO "ledger_accounts" ("id","code","name","type") VALUES
('21000000-0000-4000-8000-000000000001','CASH_MPESA_BANK','M-Pesa and Bank Cash','ASSET'),
('21000000-0000-4000-8000-000000000002','DONATION_INCOME','Donation Income','INCOME'),
('21000000-0000-4000-8000-000000000003','STUDENT_ASSISTANCE_EXPENSE','Student Assistance Expense','EXPENSE');

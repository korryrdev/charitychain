ALTER TABLE "students" ADD COLUMN "verifiedPhone" TEXT;
ALTER TABLE "students" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "students_verifiedPhone_key" ON "students"("verifiedPhone") WHERE "verifiedPhone" IS NOT NULL;

CREATE TYPE "DisbursementType" AS ENUM ('TUITION_B2B', 'UPKEEP_B2C');
CREATE TYPE "DisbursementStatus" AS ENUM ('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REVERSED');
CREATE TYPE "DisbursementAttemptStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'SUCCEEDED', 'FAILED');

CREATE TABLE "disbursements" (
  "id" UUID NOT NULL, "applicationId" UUID NOT NULL, "type" "DisbursementType" NOT NULL,
  "status" "DisbursementStatus" NOT NULL DEFAULT 'CREATED', "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES', "destination" TEXT NOT NULL, "destinationReference" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'MPESA', "idempotencyKey" TEXT NOT NULL, "providerRequestId" TEXT,
  "providerTransactionId" TEXT, "attemptCount" INTEGER NOT NULL DEFAULT 0, "maximumAttempts" INTEGER NOT NULL DEFAULT 3,
  "failureCode" TEXT, "failureMessage" TEXT, "receiptData" JSONB, "receiptHash" TEXT,
  "initiatedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "disbursements_amount_check" CHECK ("amount" > 0), CONSTRAINT "disbursements_attempts_check" CHECK ("attemptCount" >= 0 AND "maximumAttempts" BETWEEN 1 AND 5)
);
CREATE TABLE "disbursement_attempts" (
  "id" UUID NOT NULL, "disbursementId" UUID NOT NULL, "sequence" INTEGER NOT NULL,
  "status" "DisbursementAttemptStatus" NOT NULL DEFAULT 'REQUESTED', "requestPayload" JSONB NOT NULL,
  "responsePayload" JSONB, "providerRequestId" TEXT, "failureCode" TEXT, "failureMessage" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  CONSTRAINT "disbursement_attempts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "disbursement_provider_events" (
  "id" UUID NOT NULL, "disbursementId" UUID NOT NULL, "providerEventId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL, "rawPayload" JSONB NOT NULL, "processingStatus" "ProviderEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "resultCode" TEXT, "resultMessage" TEXT, "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3), CONSTRAINT "disbursement_provider_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "disbursements_applicationId_key" ON "disbursements"("applicationId");
CREATE UNIQUE INDEX "disbursements_idempotencyKey_key" ON "disbursements"("idempotencyKey");
CREATE UNIQUE INDEX "disbursements_providerRequestId_key" ON "disbursements"("providerRequestId");
CREATE UNIQUE INDEX "disbursements_providerTransactionId_key" ON "disbursements"("providerTransactionId");
CREATE INDEX "disbursements_status_createdAt_idx" ON "disbursements"("status", "createdAt");
CREATE UNIQUE INDEX "disbursement_attempts_disbursementId_sequence_key" ON "disbursement_attempts"("disbursementId", "sequence");
CREATE UNIQUE INDEX "disbursement_attempts_providerRequestId_key" ON "disbursement_attempts"("providerRequestId");
CREATE INDEX "disbursement_attempts_status_requestedAt_idx" ON "disbursement_attempts"("status", "requestedAt");
CREATE UNIQUE INDEX "disbursement_provider_events_providerEventId_key" ON "disbursement_provider_events"("providerEventId");
CREATE INDEX "disbursement_provider_events_disbursementId_receivedAt_idx" ON "disbursement_provider_events"("disbursementId", "receivedAt");
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "assistance_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disbursement_attempts" ADD CONSTRAINT "disbursement_attempts_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "disbursements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disbursement_provider_events" ADD CONSTRAINT "disbursement_provider_events_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "disbursements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

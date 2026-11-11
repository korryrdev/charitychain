CREATE TYPE "PaymentProvider" AS ENUM ('MPESA', 'BANK');
CREATE TYPE "PaymentFlow" AS ENUM ('STK_PUSH', 'C2B', 'BANK_CHECKOUT', 'BANK_TRANSFER');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'SUBMITTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "ProviderEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED');

CREATE TABLE "payment_attempts" (
  "id" UUID NOT NULL, "donationId" UUID NOT NULL, "provider" "PaymentProvider" NOT NULL,
  "flow" "PaymentFlow" NOT NULL, "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
  "amount" DECIMAL(18,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'KES', "idempotencyKey" TEXT NOT NULL,
  "destinationFingerprint" TEXT, "requestPayloadDigest" TEXT NOT NULL, "providerRequestId" TEXT,
  "providerTransactionId" TEXT, "responseCode" TEXT, "responseMessage" TEXT, "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "payment_provider_events" (
  "id" UUID NOT NULL, "paymentAttemptId" UUID, "provider" "PaymentProvider" NOT NULL, "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL, "payloadDigest" TEXT NOT NULL, "signatureDigest" TEXT,
  "processingStatus" "ProviderEventStatus" NOT NULL DEFAULT 'RECEIVED', "resultCode" TEXT, "resultMessage" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3),
  CONSTRAINT "payment_provider_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_attempts_providerRequestId_key" ON "payment_attempts"("providerRequestId");
CREATE UNIQUE INDEX "payment_attempts_providerTransactionId_key" ON "payment_attempts"("providerTransactionId");
CREATE INDEX "payment_attempts_donationId_createdAt_idx" ON "payment_attempts"("donationId", "createdAt");
CREATE INDEX "payment_attempts_provider_status_createdAt_idx" ON "payment_attempts"("provider", "status", "createdAt");
CREATE UNIQUE INDEX "payment_attempts_donationId_idempotencyKey_key" ON "payment_attempts"("donationId", "idempotencyKey");
CREATE INDEX "payment_provider_events_paymentAttemptId_receivedAt_idx" ON "payment_provider_events"("paymentAttemptId", "receivedAt");
CREATE INDEX "payment_provider_events_processingStatus_receivedAt_idx" ON "payment_provider_events"("processingStatus", "receivedAt");
CREATE UNIQUE INDEX "payment_provider_events_provider_providerEventId_key" ON "payment_provider_events"("provider", "providerEventId");
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "money_donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_provider_events" ADD CONSTRAINT "payment_provider_events_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

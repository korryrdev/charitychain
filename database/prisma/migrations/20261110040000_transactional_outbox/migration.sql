CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

CREATE TABLE "outbox_events" (
  "id" UUID NOT NULL,
  "eventName" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT,
  "payload" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "maximumAttempts" INTEGER NOT NULL DEFAULT 8,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseToken" TEXT,
  "leasedUntil" TIMESTAMP(3),
  "lastError" TEXT,
  "publishedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "outbox_events_attempt_count_check" CHECK ("attemptCount" >= 0 AND "maximumAttempts" > 0 AND "attemptCount" <= "maximumAttempts")
);

CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");
CREATE INDEX "outbox_events_status_availableAt_createdAt_idx" ON "outbox_events"("status", "availableAt", "createdAt");
CREATE INDEX "outbox_events_leasedUntil_idx" ON "outbox_events"("leasedUntil");

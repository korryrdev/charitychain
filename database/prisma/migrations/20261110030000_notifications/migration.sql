CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS');
CREATE TYPE "NotificationTemplateCode" AS ENUM ('DONATION_STATUS', 'APPLICATION_STATUS', 'APPROVAL_STATUS', 'DISBURSEMENT_STATUS', 'GOODS_COLLECTION_STATUS', 'SECURITY_ALERT');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "recipientUserId" UUID,
  "recipientAddressHash" TEXT NOT NULL,
  "recipientAddressLast4" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "templateCode" "NotificationTemplateCode" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotencyKey" TEXT NOT NULL,
  "maximumAttempts" INTEGER NOT NULL DEFAULT 3,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_attempt_count_check" CHECK ("attemptCount" >= 0 AND "maximumAttempts" > 0 AND "attemptCount" <= "maximumAttempts")
);
CREATE TABLE "notification_deliveries" (
  "id" UUID NOT NULL,
  "notificationId" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" "NotificationStatus" NOT NULL,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_deliveries_sequence_check" CHECK ("sequence" > 0)
);
CREATE UNIQUE INDEX "notifications_recipientAddressHash_idempotencyKey_key" ON "notifications"("recipientAddressHash", "idempotencyKey");
CREATE INDEX "notifications_recipientUserId_createdAt_idx" ON "notifications"("recipientUserId", "createdAt");
CREATE INDEX "notifications_status_createdAt_idx" ON "notifications"("status", "createdAt");
CREATE UNIQUE INDEX "notification_deliveries_notificationId_sequence_key" ON "notification_deliveries"("notificationId", "sequence");
CREATE UNIQUE INDEX "notification_deliveries_providerMessageId_key" ON "notification_deliveries"("providerMessageId");
CREATE INDEX "notification_deliveries_status_attemptedAt_idx" ON "notification_deliveries"("status", "attemptedAt");
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

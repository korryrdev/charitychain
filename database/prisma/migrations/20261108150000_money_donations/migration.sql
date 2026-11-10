-- CreateEnum
CREATE TYPE "MoneyDonationChannel" AS ENUM ('MPESA_STK', 'MPESA_PAYBILL', 'BANK');

-- CreateEnum
CREATE TYPE "DonationPurpose" AS ENUM ('UNRESTRICTED', 'TUITION', 'UPKEEP');

-- CreateEnum
CREATE TYPE "MoneyDonationStatus" AS ENUM ('CREATED', 'PAYMENT_REQUESTED', 'PROVIDER_PENDING', 'CONFIRMED', 'RECONCILED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "DonationAllocationType" AS ENUM ('CENTRAL_POOL', 'STUDENT_APPLICATION', 'DISBURSEMENT');

-- CreateEnum
CREATE TYPE "DonationAllocationStatus" AS ENUM ('ALLOCATED', 'APPLIED', 'REVERSED');

-- CreateTable
CREATE TABLE "money_donations" (
    "id" UUID NOT NULL,
    "donorProfileId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "channel" "MoneyDonationChannel" NOT NULL,
    "purpose" "DonationPurpose" NOT NULL DEFAULT 'UNRESTRICTED',
    "purposeReference" TEXT,
    "status" "MoneyDonationStatus" NOT NULL DEFAULT 'CREATED',
    "trackingId" TEXT NOT NULL,
    "trackingSecretHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerReference" TEXT,
    "providerReceipt" TEXT,
    "failureCode" TEXT,
    "failureReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "reconciledAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "money_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_allocations" (
    "id" UUID NOT NULL,
    "donationId" UUID NOT NULL,
    "allocationType" "DonationAllocationType" NOT NULL,
    "targetReference" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "DonationAllocationStatus" NOT NULL DEFAULT 'ALLOCATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_receipts" (
    "id" UUID NOT NULL,
    "donationId" UUID NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "evidenceDigest" TEXT NOT NULL,
    "ipfsCid" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),

    CONSTRAINT "donation_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "money_donations_trackingId_key" ON "money_donations"("trackingId");
CREATE UNIQUE INDEX "money_donations_providerReference_key" ON "money_donations"("providerReference");
CREATE UNIQUE INDEX "money_donations_providerReceipt_key" ON "money_donations"("providerReceipt");
CREATE INDEX "money_donations_donorProfileId_createdAt_idx" ON "money_donations"("donorProfileId", "createdAt");
CREATE INDEX "money_donations_status_createdAt_idx" ON "money_donations"("status", "createdAt");
CREATE UNIQUE INDEX "money_donations_donorProfileId_idempotencyKey_key" ON "money_donations"("donorProfileId", "idempotencyKey");
CREATE INDEX "donation_allocations_donationId_createdAt_idx" ON "donation_allocations"("donationId", "createdAt");
CREATE UNIQUE INDEX "donation_allocations_donationId_allocationType_targetRefere_key" ON "donation_allocations"("donationId", "allocationType", "targetReference");
CREATE UNIQUE INDEX "donation_receipts_donationId_key" ON "donation_receipts"("donationId");
CREATE UNIQUE INDEX "donation_receipts_receiptNumber_key" ON "donation_receipts"("receiptNumber");

-- AddForeignKey
ALTER TABLE "money_donations" ADD CONSTRAINT "money_donations_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "donor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "donation_allocations" ADD CONSTRAINT "donation_allocations_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "money_donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "donation_receipts" ADD CONSTRAINT "donation_receipts_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "money_donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create donor identity, privacy, and recognition structures.
CREATE TYPE "PublicNameMode" AS ENUM ('ALIAS', 'REAL_NAME');
CREATE TYPE "AliasReviewStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'REJECTED');
CREATE TYPE "RecognitionTierCode" AS ENUM ('UNRANKED', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM');
CREATE TYPE "ContributionType" AS ENUM ('MONEY', 'GOODS');

CREATE TABLE "donor_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "publicAlias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "pendingAlias" TEXT,
    "pendingNormalizedAlias" TEXT,
    "aliasReviewStatus" "AliasReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "displayNameMode" "PublicNameMode" NOT NULL DEFAULT 'ALIAS',
    "publicListed" BOOLEAN NOT NULL DEFAULT true,
    "showContributionTotal" BOOLEAN NOT NULL DEFAULT false,
    "showRecognitionTier" BOOLEAN NOT NULL DEFAULT true,
    "moneyContribution" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "goodsContribution" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalContribution" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "recognitionTier" "RecognitionTierCode" NOT NULL DEFAULT 'UNRANKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "donor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognition_tiers" (
    "id" UUID NOT NULL,
    "code" "RecognitionTierCode" NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "minimumValue" DECIMAL(18,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recognition_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognition_history" (
    "id" UUID NOT NULL,
    "donorProfileId" UUID NOT NULL,
    "fromTier" "RecognitionTierCode" NOT NULL,
    "toTier" "RecognitionTierCode" NOT NULL,
    "totalValue" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recognition_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognized_contributions" (
    "id" UUID NOT NULL,
    "donorProfileId" UUID NOT NULL,
    "sourceType" "ContributionType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recognized_contributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "donor_profiles_userId_key" ON "donor_profiles"("userId");
CREATE UNIQUE INDEX "donor_profiles_publicAlias_key" ON "donor_profiles"("publicAlias");
CREATE UNIQUE INDEX "donor_profiles_normalizedAlias_key" ON "donor_profiles"("normalizedAlias");
CREATE UNIQUE INDEX "donor_profiles_pendingNormalizedAlias_key" ON "donor_profiles"("pendingNormalizedAlias");
CREATE INDEX "donor_profiles_publicListed_recognitionTier_idx" ON "donor_profiles"("publicListed", "recognitionTier");
CREATE UNIQUE INDEX "recognition_tiers_code_key" ON "recognition_tiers"("code");
CREATE UNIQUE INDEX "recognition_tiers_rank_key" ON "recognition_tiers"("rank");
CREATE INDEX "recognition_history_donorProfileId_createdAt_idx" ON "recognition_history"("donorProfileId", "createdAt");
CREATE INDEX "recognized_contributions_donorProfileId_createdAt_idx" ON "recognized_contributions"("donorProfileId", "createdAt");
CREATE UNIQUE INDEX "recognized_contributions_sourceType_sourceId_key" ON "recognized_contributions"("sourceType", "sourceId");

ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognition_history" ADD CONSTRAINT "recognition_history_donorProfileId_fkey"
FOREIGN KEY ("donorProfileId") REFERENCES "donor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognized_contributions" ADD CONSTRAINT "recognized_contributions_donorProfileId_fkey"
FOREIGN KEY ("donorProfileId") REFERENCES "donor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

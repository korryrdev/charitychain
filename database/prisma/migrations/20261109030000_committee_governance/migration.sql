CREATE TYPE "CommitteeSeat" AS ENUM ('CHAIRPERSON', 'TREASURER', 'SECRETARY');
CREATE TYPE "CommitteeMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ENDED');
CREATE TYPE "CommitteeConflictType" AS ENUM ('FAMILY_RELATIONSHIP', 'FINANCIAL_INTEREST', 'ORGANIZATIONAL_RELATIONSHIP', 'PERSONAL_RELATIONSHIP', 'OTHER');
CREATE TYPE "CommitteeConflictStatus" AS ENUM ('DECLARED', 'CONFIRMED', 'DISMISSED');

CREATE TABLE "committee_memberships" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "seat" "CommitteeSeat" NOT NULL,
  "status" "CommitteeMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "appointedById" UUID NOT NULL,
  "appointedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "termStartsAt" TIMESTAMP(3) NOT NULL,
  "termEndsAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "endReason" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "committee_memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "committee_memberships_term_check" CHECK ("termEndsAt" > "termStartsAt")
);

CREATE TABLE "committee_membership_history" (
  "id" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  "fromStatus" "CommitteeMembershipStatus",
  "toStatus" "CommitteeMembershipStatus" NOT NULL,
  "actorUserId" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "committee_membership_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "committee_conflicts" (
  "id" UUID NOT NULL,
  "membershipId" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "type" "CommitteeConflictType" NOT NULL,
  "status" "CommitteeConflictStatus" NOT NULL DEFAULT 'DECLARED',
  "description" TEXT NOT NULL,
  "declaredByUserId" UUID NOT NULL,
  "resolvedByUserId" UUID,
  "resolutionNote" TEXT,
  "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "committee_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "committee_memberships_status_termStartsAt_termEndsAt_idx" ON "committee_memberships"("status", "termStartsAt", "termEndsAt");
CREATE INDEX "committee_memberships_userId_appointedAt_idx" ON "committee_memberships"("userId", "appointedAt");
CREATE INDEX "committee_memberships_seat_status_idx" ON "committee_memberships"("seat", "status");
CREATE UNIQUE INDEX "committee_memberships_one_active_user" ON "committee_memberships"("userId") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "committee_memberships_one_active_seat" ON "committee_memberships"("seat") WHERE "status" = 'ACTIVE';
CREATE INDEX "committee_membership_history_membershipId_createdAt_idx" ON "committee_membership_history"("membershipId", "createdAt");
CREATE UNIQUE INDEX "committee_conflicts_membershipId_applicationId_key" ON "committee_conflicts"("membershipId", "applicationId");
CREATE INDEX "committee_conflicts_applicationId_status_idx" ON "committee_conflicts"("applicationId", "status");

ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_appointedById_fkey" FOREIGN KEY ("appointedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_membership_history" ADD CONSTRAINT "committee_membership_history_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "committee_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_membership_history" ADD CONSTRAINT "committee_membership_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_conflicts" ADD CONSTRAINT "committee_conflicts_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "committee_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_conflicts" ADD CONSTRAINT "committee_conflicts_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "assistance_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_conflicts" ADD CONSTRAINT "committee_conflicts_declaredByUserId_fkey" FOREIGN KEY ("declaredByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "committee_conflicts" ADD CONSTRAINT "committee_conflicts_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Staff temporary-password enforcement
ALTER TABLE "users"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "temporaryPasswordExpiresAt" TIMESTAMP(3);

-- Persistent throttling for login failures, resend, reset and registration
CREATE TABLE "auth_throttles" (
  "key" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "failures" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_throttles_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "auth_throttles_updatedAt_idx" ON "auth_throttles"("updatedAt");

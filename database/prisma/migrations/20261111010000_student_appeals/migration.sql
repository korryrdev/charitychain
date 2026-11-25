CREATE TABLE "student_appeals" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "applicationId" UUID,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "student_appeals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_appeals_studentId_createdAt_idx" ON "student_appeals"("studentId", "createdAt");
CREATE INDEX "student_appeals_applicationId_createdAt_idx" ON "student_appeals"("applicationId", "createdAt");

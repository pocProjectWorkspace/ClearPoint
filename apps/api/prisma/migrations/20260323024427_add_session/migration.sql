-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" DATETIME,
    "completedAt" DATETIME,
    "resumeToken" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_engagementId_key" ON "Session"("engagementId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_resumeToken_key" ON "Session"("resumeToken");

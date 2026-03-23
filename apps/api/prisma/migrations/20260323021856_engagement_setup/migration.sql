-- CreateTable
CREATE TABLE "Consultant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "clientName" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT '',
    "companySize" TEXT NOT NULL DEFAULT '',
    "revenueRange" TEXT NOT NULL DEFAULT '',
    "geography" TEXT NOT NULL DEFAULT '',
    "strategicPriorities" TEXT NOT NULL DEFAULT '',
    "consultantHypothesis" TEXT NOT NULL DEFAULT '',
    "confidenceLevel" TEXT NOT NULL DEFAULT 'medium',
    "domainsInScope" TEXT NOT NULL DEFAULT '[]',
    "interventionWeights" TEXT NOT NULL DEFAULT '{"process":25,"automation":25,"analytics":25,"ai":25}',
    "ambitionTargets" TEXT NOT NULL DEFAULT '{"costReductionPct":0,"productivityGainPct":0,"revenueImpactPct":0}',
    "status" TEXT NOT NULL DEFAULT 'setup',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consultantId" TEXT NOT NULL,
    CONSTRAINT "Engagement_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "weightedScore" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Answer_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiagnosticResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "domainScores" TEXT NOT NULL,
    "patterns" TEXT NOT NULL,
    "rootCauses" TEXT NOT NULL,
    "interventionMap" TEXT NOT NULL,
    "roadmap" TEXT NOT NULL,
    "businessCase" TEXT NOT NULL,
    "reasoningLog" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosticResult_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Consultant_email_key" ON "Consultant"("email");

-- CreateIndex
CREATE INDEX "Engagement_consultantId_idx" ON "Engagement"("consultantId");

-- CreateIndex
CREATE INDEX "Engagement_status_idx" ON "Engagement"("status");

-- CreateIndex
CREATE INDEX "Answer_engagementId_idx" ON "Answer"("engagementId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_engagementId_questionId_key" ON "Answer"("engagementId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticResult_engagementId_key" ON "DiagnosticResult"("engagementId");

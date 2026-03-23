-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Annotation_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Annotation_engagementId_idx" ON "Annotation"("engagementId");

-- CreateIndex
CREATE UNIQUE INDEX "Annotation_engagementId_type_itemId_key" ON "Annotation"("engagementId", "type", "itemId");

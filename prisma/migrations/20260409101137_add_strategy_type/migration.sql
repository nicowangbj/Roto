-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "strategyType" TEXT NOT NULL DEFAULT 'generation',
    "description" TEXT,
    "triggerTiming" TEXT,
    "promptTemplate" TEXT NOT NULL DEFAULT '',
    "inputSchema" TEXT,
    "outputSchema" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AIStrategy" ("code", "createdAt", "description", "id", "inputSchema", "isConfigured", "module", "name", "outputSchema", "promptTemplate", "triggerTiming", "updatedAt") SELECT "code", "createdAt", "description", "id", "inputSchema", "isConfigured", "module", "name", "outputSchema", "promptTemplate", "triggerTiming", "updatedAt" FROM "AIStrategy";
DROP TABLE "AIStrategy";
ALTER TABLE "new_AIStrategy" RENAME TO "AIStrategy";
CREATE UNIQUE INDEX "AIStrategy_code_key" ON "AIStrategy"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

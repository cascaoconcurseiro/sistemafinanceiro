/*
  Warnings:

  - You are about to drop the column `details` on the `system_events` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `system_events` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `system_events` table. All the data in the column will be lost.
  - You are about to drop the column `memoryUsage` on the `system_events` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `system_events` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `system_events` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `system_events` table. All the data in the column will be lost.
  - Added the required column `entity_id` to the `system_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_type` to the `system_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_type` to the `system_events` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_system_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "data" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_system_events" ("id", "type") SELECT "id", "type" FROM "system_events";
DROP TABLE "system_events";
ALTER TABLE "new_system_events" RENAME TO "system_events";
CREATE INDEX "system_events_event_type_processed_idx" ON "system_events"("event_type", "processed");
CREATE INDEX "system_events_entity_type_entity_id_idx" ON "system_events"("entity_type", "entity_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

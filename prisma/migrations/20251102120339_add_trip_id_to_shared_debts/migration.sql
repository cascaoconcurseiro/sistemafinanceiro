-- AlterTable
ALTER TABLE "shared_debts" ADD COLUMN "trip_id" TEXT;

-- CreateIndex
CREATE INDEX "shared_debts_trip_id_idx" ON "shared_debts"("trip_id");

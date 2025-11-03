-- CreateTable
CREATE TABLE "account_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "balance" DECIMAL NOT NULL,
    "change" DECIMAL NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_history_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank_reconciliations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "bank_balance" DECIMAL NOT NULL,
    "system_balance" DECIMAL NOT NULL,
    "difference" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reconciled_at" DATETIME,
    "reconciled_by" TEXT,
    "adjustment_id" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "account_history_account_id_date_idx" ON "account_history"("account_id", "date");

-- CreateIndex
CREATE INDEX "bank_reconciliations_account_id_date_idx" ON "bank_reconciliations"("account_id", "date");

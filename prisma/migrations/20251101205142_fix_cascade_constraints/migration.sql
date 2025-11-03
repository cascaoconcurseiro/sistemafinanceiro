-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "category_id" TEXT,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'cleared',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "transfer_id" TEXT,
    "parent_transaction_id" TEXT,
    "installment_number" INTEGER,
    "total_installments" INTEGER,
    "trip_id" TEXT,
    "goal_id" TEXT,
    "investment_id" TEXT,
    "budget_id" TEXT,
    "credit_card_id" TEXT,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "installment_group_id" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_with" TEXT,
    "total_shared_amount" DECIMAL,
    "my_share" DECIMAL,
    "paid_by" TEXT,
    "owed_to" TEXT,
    "payment_method" TEXT,
    "is_transfer" BOOLEAN NOT NULL DEFAULT false,
    "transfer_type" TEXT,
    "recurring_id" TEXT,
    "frequency" TEXT,
    "is_reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" DATETIME,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "exchange_rate" DECIMAL,
    "original_amount" DECIMAL,
    "is_tax_deductible" BOOLEAN NOT NULL DEFAULT false,
    "tax_category" TEXT,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "is_fraudulent" BOOLEAN NOT NULL DEFAULT false,
    "is_installment" BOOLEAN NOT NULL DEFAULT false,
    "trip_expense_type" TEXT,
    "invoice_id" TEXT,
    "metadata" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("account_id", "amount", "budget_id", "category_id", "created_at", "credit_card_id", "currency", "date", "deleted_at", "description", "exchange_rate", "frequency", "goal_id", "id", "installment_group_id", "installment_number", "investment_id", "invoice_id", "is_fraudulent", "is_installment", "is_reconciled", "is_recurring", "is_shared", "is_suspicious", "is_tax_deductible", "is_transfer", "metadata", "my_share", "original_amount", "owed_to", "paid_by", "parent_transaction_id", "payment_method", "reconciled_at", "recurring_id", "shared_with", "status", "tax_category", "total_installments", "total_shared_amount", "transfer_id", "transfer_type", "trip_expense_type", "trip_id", "type", "updated_at", "user_id", "version") SELECT "account_id", "amount", "budget_id", "category_id", "created_at", "credit_card_id", "currency", "date", "deleted_at", "description", "exchange_rate", "frequency", "goal_id", "id", "installment_group_id", "installment_number", "investment_id", "invoice_id", "is_fraudulent", "is_installment", "is_reconciled", "is_recurring", "is_shared", "is_suspicious", "is_tax_deductible", "is_transfer", "metadata", "my_share", "original_amount", "owed_to", "paid_by", "parent_transaction_id", "payment_method", "reconciled_at", "recurring_id", "shared_with", "status", "tax_category", "total_installments", "total_shared_amount", "transfer_id", "transfer_type", "trip_expense_type", "trip_id", "type", "updated_at", "user_id", "version" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");
CREATE INDEX "transactions_account_id_date_idx" ON "transactions"("account_id", "date");
CREATE INDEX "transactions_trip_id_idx" ON "transactions"("trip_id");
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
CREATE INDEX "transactions_is_shared_idx" ON "transactions"("is_shared");
CREATE INDEX "transactions_installment_group_id_idx" ON "transactions"("installment_group_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

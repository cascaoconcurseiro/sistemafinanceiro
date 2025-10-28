-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "email_verified" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "monthly_income" DECIMAL,
    "emergency_reserve" DECIMAL,
    "risk_profile" TEXT,
    "financial_goals" TEXT,
    "preferences" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "reconciled_balance" DECIMAL NOT NULL DEFAULT 0,
    "is_investment" BOOLEAN NOT NULL DEFAULT false,
    "investment_type" TEXT,
    "current_value" DECIMAL,
    "invested_amount" DECIMAL,
    "allow_negative_balance" BOOLEAN NOT NULL DEFAULT false,
    "overdraft_limit" DECIMAL NOT NULL DEFAULT 0,
    "overdraft_interest_rate" DECIMAL,
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
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
    CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit" DECIMAL NOT NULL,
    "currentBalance" DECIMAL NOT NULL DEFAULT 0,
    "dueDay" INTEGER NOT NULL,
    "closingDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "interest_rate" DECIMAL,
    "allow_over_limit" BOOLEAN NOT NULL DEFAULT false,
    "over_limit_percent" INTEGER NOT NULL DEFAULT 0,
    "brand" TEXT,
    "last_four_digits" TEXT,
    CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "payment_date" DATETIME NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reversed_at" DATETIME,
    "reversal_reason" TEXT,
    "original_payment_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoice_payments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "birthDate" DATETIME,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATETIME NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "amount" DECIMAL,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "parent_id" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "spent" DECIMAL NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budgets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "current_amount" DECIMAL NOT NULL DEFAULT 0,
    "target_amount" DECIMAL NOT NULL,
    "deadline" DATETIME,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "quantity" DECIMAL NOT NULL,
    "average_price" DECIMAL NOT NULL,
    "purchase_price" DECIMAL NOT NULL,
    "current_price" DECIMAL,
    "total_invested" DECIMAL NOT NULL,
    "current_value" DECIMAL NOT NULL DEFAULT 0,
    "brokerage_fee" DECIMAL NOT NULL DEFAULT 0,
    "other_fees" DECIMAL NOT NULL DEFAULT 0,
    "fees" DECIMAL NOT NULL DEFAULT 0,
    "profit_loss" DECIMAL NOT NULL DEFAULT 0,
    "profit_loss_percent" DECIMAL NOT NULL DEFAULT 0,
    "interest_rate" DECIMAL,
    "indexer" TEXT,
    "maturity_date" DATETIME,
    "liquidity" TEXT,
    "last_dividend" DECIMAL,
    "last_dividend_date" DATETIME,
    "dividend_yield" DECIMAL,
    "broker" TEXT,
    "purchase_date" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dividends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gross_amount" DECIMAL NOT NULL,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "net_amount" DECIMAL NOT NULL,
    "payment_date" DATETIME NOT NULL,
    "ex_date" DATETIME,
    "description" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dividends_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dividends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "investment_price_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "price" DECIMAL NOT NULL,
    "source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "investment_price_history_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "investment_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" DECIMAL NOT NULL,
    "current_amount" DECIMAL NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "monthly_contribution" DECIMAL NOT NULL,
    "expected_return" DECIMAL NOT NULL,
    "risk_profile" TEXT NOT NULL,
    "fixed_income_percent" INTEGER NOT NULL,
    "stocks_percent" INTEGER NOT NULL,
    "reits_percent" INTEGER NOT NULL,
    "crypto_percent" INTEGER NOT NULL DEFAULT 0,
    "international_percent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "investment_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" DATETIME,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "spent" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "participants" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" DATETIME NOT NULL,
    CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "itinerary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER,
    "cost" DECIMAL DEFAULT 0,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "itinerary_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shared_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "shareAmount" DECIMAL NOT NULL,
    "sharePercentage" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shared_expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "shared_expenses_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scheduled_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "parentTransactionId" TEXT,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "recurringInterval" INTEGER,
    "recurringEndDate" DATETIME,
    "transferId" TEXT,
    "tripId" TEXT,
    "sharedWith" TEXT,
    "notes" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scheduled_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "scheduled_transactions_parentTransactionId_fkey" FOREIGN KEY ("parentTransactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scheduled_transactions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_audit_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "journal_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "journal_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "old_values" TEXT,
    "new_values" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "stackTrace" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "duration" INTEGER,
    "memoryUsage" BIGINT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data_integrity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "lastValidated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "errors" TEXT
);

-- CreateTable
CREATE TABLE "shared_debts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "creditor_id" TEXT NOT NULL,
    "debtor_id" TEXT NOT NULL,
    "original_amount" DECIMAL NOT NULL,
    "current_amount" DECIMAL NOT NULL,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "transaction_id" TEXT,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shared_debts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paid_date" DATETIME NOT NULL,
    "description" TEXT,
    "debts_affected" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "debt_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "nextDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recurring_transaction_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "templateData" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "occurrences" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_generated" DATETIME,
    "next_generation" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transaction_tags" (
    "transaction_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("transaction_id", "tag_id"),
    CONSTRAINT "transaction_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credit_card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "due_date" DATETIME NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "paid_at" DATETIME,
    "minimum_payment" DECIMAL NOT NULL DEFAULT 0,
    "is_rotativo" BOOLEAN NOT NULL DEFAULT false,
    "rotativo_interest_rate" DECIMAL NOT NULL DEFAULT 15.0,
    "remaining_balance" DECIMAL NOT NULL DEFAULT 0,
    "previous_balance" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "total_installments" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" DATETIME,
    "description" TEXT,
    "can_anticipate" BOOLEAN NOT NULL DEFAULT true,
    "anticipated_at" DATETIME,
    "discount_applied" DECIMAL NOT NULL DEFAULT 0,
    "original_amount" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "shopping_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trip_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimated_price" DECIMAL NOT NULL,
    "actual_price" DECIMAL,
    "is_purchased" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "purchase_date" DATETIME,
    "purchase_location" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shopping_items_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "currency_exchanges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trip_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount_brl" DECIMAL NOT NULL,
    "amount_foreign" DECIMAL NOT NULL,
    "exchange_rate" DECIMAL NOT NULL,
    "cet" DECIMAL,
    "location" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "currency_exchanges_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "default_currency" TEXT NOT NULL DEFAULT 'BRL',
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "invoice_reminder" INTEGER NOT NULL DEFAULT 3,
    "budget_alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "auto_backup" BOOLEAN NOT NULL DEFAULT false,
    "backup_frequency" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "transactions_account_id_date_idx" ON "transactions"("account_id", "date");

-- CreateIndex
CREATE INDEX "transactions_trip_id_idx" ON "transactions"("trip_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_is_shared_idx" ON "transactions"("is_shared");

-- CreateIndex
CREATE INDEX "transactions_installment_group_id_idx" ON "transactions"("installment_group_id");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "investments_user_id_status_idx" ON "investments"("user_id", "status");

-- CreateIndex
CREATE INDEX "investments_type_status_idx" ON "investments"("type", "status");

-- CreateIndex
CREATE INDEX "dividends_user_id_payment_date_idx" ON "dividends"("user_id", "payment_date");

-- CreateIndex
CREATE INDEX "dividends_investment_id_idx" ON "dividends"("investment_id");

-- CreateIndex
CREATE INDEX "investment_price_history_investment_id_date_idx" ON "investment_price_history"("investment_id", "date");

-- CreateIndex
CREATE INDEX "investment_goals_user_id_status_idx" ON "investment_goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "investment_events_user_id_date_status_idx" ON "investment_events"("user_id", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "shared_debts_user_id_status_idx" ON "shared_debts"("user_id", "status");

-- CreateIndex
CREATE INDEX "shared_debts_creditor_id_idx" ON "shared_debts"("creditor_id");

-- CreateIndex
CREATE INDEX "shared_debts_debtor_id_idx" ON "shared_debts"("debtor_id");

-- CreateIndex
CREATE INDEX "recurring_transaction_templates_user_id_next_generation_idx" ON "recurring_transaction_templates"("user_id", "next_generation");

-- CreateIndex
CREATE INDEX "attachments_transaction_id_idx" ON "attachments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "invoices_user_id_due_date_idx" ON "invoices"("user_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_credit_card_id_month_year_key" ON "invoices"("credit_card_id", "month", "year");

-- CreateIndex
CREATE INDEX "installments_user_id_status_due_date_idx" ON "installments"("user_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "installments_transaction_id_idx" ON "installments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

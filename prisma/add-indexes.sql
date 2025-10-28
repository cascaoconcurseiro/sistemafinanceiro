-- Índices para otimização de performance
-- Execute este arquivo após aplicar as migrations

-- Índices para Transaction (queries mais frequentes)
CREATE INDEX IF NOT EXISTS idx_transaction_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_account ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_category ON transactions(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_type_date ON transactions(type, date DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_status ON transactions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_trip ON transactions(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_goal ON transactions(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_installment ON transactions(installment_group_id) WHERE installment_group_id IS NOT NULL;

-- Índices para Account
CREATE INDEX IF NOT EXISTS idx_account_user ON accounts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_type ON accounts(type, is_active);
CREATE INDEX IF NOT EXISTS idx_account_active ON accounts(is_active) WHERE deleted_at IS NULL;

-- Índices para Budget
CREATE INDEX IF NOT EXISTS idx_budget_user_period ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_budget_category ON budgets(category_id);

-- Índices para Goal
CREATE INDEX IF NOT EXISTS idx_goal_user ON goals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goal_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_target_date ON goals(target_date);

-- Índices para Investment
CREATE INDEX IF NOT EXISTS idx_investment_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_type ON investments(type);
CREATE INDEX IF NOT EXISTS idx_investment_status ON investments(status);

-- Índices para CreditCard
CREATE INDEX IF NOT EXISTS idx_credit_card_user ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_active ON credit_cards(is_active);

-- Índices para Trip
CREATE INDEX IF NOT EXISTS idx_trip_user ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_dates ON trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trip_status ON trips(status);

-- Índices para Notification
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(created_at DESC);

-- Índices para Reminder
CREATE INDEX IF NOT EXISTS idx_reminder_user_date ON reminders(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminders(is_completed);

-- Índices para AuditEvent
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);

-- Índices compostos para queries complexas
CREATE INDEX IF NOT EXISTS idx_transaction_user_account_date ON transactions(user_id, account_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_user_category_date ON transactions(user_id, category_id, date DESC) WHERE deleted_at IS NULL;

-- Análise de tabelas para otimizar query planner
ANALYZE transactions;
ANALYZE accounts;
ANALYZE budgets;
ANALYZE goals;
ANALYZE investments;
ANALYZE credit_cards;
ANALYZE trips;
ANALYZE notifications;
ANALYZE reminders;
ANALYZE audit_events;

-- ============================================================================
-- PLANO DE MIGRAÇÃO PARA NOVA ESTRUTURA
-- Objetivo: Migrar dados existentes mantendo integridade
-- ============================================================================

-- FASE 1: BACKUP DOS DADOS EXISTENTES
-- ============================================================================

-- Criar tabelas de backup
CREATE TABLE backup_users AS SELECT * FROM users;
CREATE TABLE backup_accounts AS SELECT * FROM accounts;
CREATE TABLE backup_transactions AS SELECT * FROM transactions;
CREATE TABLE backup_entries AS SELECT * FROM entries;
CREATE TABLE backup_goals AS SELECT * FROM goals;
CREATE TABLE backup_investments AS SELECT * FROM investments;
CREATE TABLE backup_trips AS SELECT * FROM trips;
CREATE TABLE backup_budgets AS SELECT * FROM budgets;
CREATE TABLE backup_contacts AS SELECT * FROM contacts;

-- FASE 2: LIMPEZA E PREPARAÇÃO
-- ============================================================================

-- Remover constraints que podem causar problemas
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_tenant_id_fkey;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_tenant_id_fkey;
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_tenant_id_fkey;

-- FASE 3: TRANSFORMAÇÃO DA ESTRUTURA
-- ============================================================================

-- 3.1: Atualizar tabela Users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS emergency_reserve DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(50),
ADD COLUMN IF NOT EXISTS financial_goals TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Remover colunas desnecessárias do sistema de tenants
-- (Manter por enquanto para não quebrar, remover depois)

-- 3.2: Atualizar tabela Accounts
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(255);

-- Migrar dados de accounts (assumindo que tenant_id corresponde a user_id)
UPDATE accounts 
SET user_id = tenant_id 
WHERE user_id IS NULL;

-- 3.3: Criar nova tabela Categories simplificada
CREATE TABLE categories_new (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id VARCHAR(255),
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (parent_id) REFERENCES categories_new(id)
);

-- Migrar categorias existentes
INSERT INTO categories_new (id, name, type, is_active, created_at, updated_at)
SELECT id, name, type, is_active, created_at, updated_at 
FROM categories;

-- 3.4: Transformar sistema de Transactions
-- Criar nova tabela de transações simplificada
CREATE TABLE transactions_new (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    reference VARCHAR(255),
    tags TEXT[],
    metadata JSONB,
    to_account_id VARCHAR(255),
    transfer_fee DECIMAL(15,2),
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories_new(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
    FOREIGN KEY (parent_transaction_id) REFERENCES transactions_new(id)
);

-- Migrar transações do sistema de entries para transações diretas
INSERT INTO transactions_new (
    id, user_id, account_id, category_id, type, amount, 
    description, date, status, created_at, updated_at
)
SELECT 
    t.id,
    t.created_by as user_id,
    e.account_id,
    COALESCE(e.category_id, 'default-category') as category_id,
    CASE 
        WHEN e.credit > 0 THEN 'income'
        WHEN e.debit > 0 THEN 'expense'
        ELSE 'transfer'
    END as type,
    GREATEST(e.credit, e.debit) as amount,
    t.description,
    t.date,
    t.status,
    t.created_at,
    t.updated_at
FROM transactions t
JOIN entries e ON t.id = e.transaction_id
WHERE e.account_id IS NOT NULL;

-- 3.5: Atualizar Goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS auto_contribute BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS contribution_frequency VARCHAR(50);

-- Migrar user_id do tenant_id
UPDATE goals 
SET user_id = (
    SELECT user_id 
    FROM user_tenants ut 
    WHERE ut.tenant_id = goals.tenant_id 
    LIMIT 1
)
WHERE user_id IS NULL;

-- 3.6: Atualizar Investments
-- Migrar user_id do tenant_id
UPDATE investments 
SET user_id = (
    SELECT user_id 
    FROM user_tenants ut 
    WHERE ut.tenant_id = investments.tenant_id 
    LIMIT 1
)
WHERE user_id IS NULL;

-- 3.7: Atualizar Trips
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}';

-- Migrar user_id do tenant_id
UPDATE trips 
SET user_id = (
    SELECT user_id 
    FROM user_tenants ut 
    WHERE ut.tenant_id = trips.tenant_id 
    LIMIT 1
)
WHERE user_id IS NULL;

-- 3.8: Criar tabela SharedExpense
CREATE TABLE shared_expenses (
    id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    share_amount DECIMAL(15,2) NOT NULL,
    share_percentage DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    paid_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (transaction_id) REFERENCES transactions_new(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 3.9: Criar tabela RecurringRule
CREATE TABLE recurring_rules (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    category_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    interval INTEGER DEFAULT 1,
    day_of_month INTEGER,
    day_of_week INTEGER,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    last_executed TIMESTAMP,
    next_execution TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_execute BOOLEAN DEFAULT false,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories_new(id)
);

-- Migrar regras recorrentes existentes
INSERT INTO recurring_rules (
    id, user_id, account_id, category_id, name, description, amount, type,
    frequency, interval, day_of_month, day_of_week, start_date, end_date,
    last_executed, next_execution, is_active, auto_execute, created_at, updated_at
)
SELECT 
    id, user_id, account_id, category_id, name, description, amount, type,
    frequency, interval, day_of_month, day_of_week, start_date, end_date,
    last_executed, next_execution, is_active, auto_execute, created_at, updated_at
FROM recurring_rules
WHERE user_id IS NOT NULL;

-- 3.10: Criar tabela AuditEvent simplificada
CREATE TABLE audit_events_new (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    severity VARCHAR(20) DEFAULT 'info',
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criar índices para performance
CREATE INDEX idx_audit_events_entity ON audit_events_new(entity_type, entity_id);
CREATE INDEX idx_audit_events_user_date ON audit_events_new(user_id, created_at);
CREATE INDEX idx_audit_events_action_date ON audit_events_new(action, created_at);

-- FASE 4: ATUALIZAÇÃO DE SALDOS DAS CONTAS
-- ============================================================================

-- Calcular saldos reais baseados nas transações
UPDATE accounts 
SET balance = (
    SELECT COALESCE(
        SUM(CASE 
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = accounts.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.to_account_id = accounts.id THEN t.amount
            ELSE 0
        END), 0
    )
    FROM transactions_new t
    WHERE t.account_id = accounts.id OR t.to_account_id = accounts.id
);

-- FASE 5: CRIAÇÃO DE VIEWS MATERIALIZADAS
-- ============================================================================

-- View para saldos de contas em tempo real
CREATE MATERIALIZED VIEW account_balances AS
SELECT 
    a.id,
    a.name,
    a.type,
    a.user_id,
    COALESCE(
        SUM(CASE 
            WHEN t.type = 'income' THEN t.amount
            WHEN t.type = 'expense' THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN t.amount
            ELSE 0
        END), 0
    ) as current_balance,
    COUNT(t.id) as transaction_count,
    MAX(t.date) as last_transaction_date
FROM accounts a
LEFT JOIN transactions_new t ON (t.account_id = a.id OR t.to_account_id = a.id)
WHERE a.is_active = true
GROUP BY a.id, a.name, a.type, a.user_id;

-- View para resumos mensais
CREATE MATERIALIZED VIEW monthly_summaries AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type = 'transfer' THEN amount ELSE 0 END) as total_transfers,
    COUNT(*) as transaction_count
FROM transactions_new
GROUP BY user_id, DATE_TRUNC('month', date);

-- View para portfolio de investimentos
CREATE MATERIALIZED VIEW investment_portfolio AS
SELECT 
    i.user_id,
    i.type,
    i.broker,
    COUNT(*) as investment_count,
    SUM(i.quantity * i.purchase_price) as total_invested,
    SUM(i.quantity * COALESCE(i.current_price, i.purchase_price)) as current_value,
    SUM(d.amount) as total_dividends
FROM investments i
LEFT JOIN dividends d ON i.id = d.investment_id
WHERE i.status = 'ACTIVE'
GROUP BY i.user_id, i.type, i.broker;

-- View para progresso das metas
CREATE MATERIALIZED VIEW goal_progress AS
SELECT 
    g.id,
    g.user_id,
    g.name,
    g.target_amount,
    g.current_amount,
    g.target_date,
    (g.current_amount / g.target_amount * 100) as progress_percentage,
    CASE 
        WHEN g.current_amount >= g.target_amount THEN 'COMPLETED'
        WHEN g.target_date < NOW() THEN 'OVERDUE'
        ELSE g.status
    END as calculated_status
FROM goals g;

-- Criar índices únicos para refresh das views
CREATE UNIQUE INDEX idx_account_balances_id ON account_balances(id);
CREATE UNIQUE INDEX idx_monthly_summaries_user_month ON monthly_summaries(user_id, month);
CREATE UNIQUE INDEX idx_investment_portfolio_user_type_broker ON investment_portfolio(user_id, type, broker);
CREATE UNIQUE INDEX idx_goal_progress_id ON goal_progress(id);

-- FASE 6: TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Trigger para atualizar saldo das contas automaticamente
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar conta de origem
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE accounts 
        SET balance = (
            SELECT COALESCE(
                SUM(CASE 
                    WHEN t.type = 'income' THEN t.amount
                    WHEN t.type = 'expense' THEN -t.amount
                    WHEN t.type = 'transfer' AND t.account_id = accounts.id THEN -t.amount
                    WHEN t.type = 'transfer' AND t.to_account_id = accounts.id THEN t.amount
                    ELSE 0
                END), 0
            )
            FROM transactions_new t
            WHERE t.account_id = accounts.id OR t.to_account_id = accounts.id
        )
        WHERE id = NEW.account_id;
        
        -- Atualizar conta de destino se for transferência
        IF NEW.to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = (
                SELECT COALESCE(
                    SUM(CASE 
                        WHEN t.type = 'income' THEN t.amount
                        WHEN t.type = 'expense' THEN -t.amount
                        WHEN t.type = 'transfer' AND t.account_id = accounts.id THEN -t.amount
                        WHEN t.type = 'transfer' AND t.to_account_id = accounts.id THEN t.amount
                        ELSE 0
                    END), 0
                )
                FROM transactions_new t
                WHERE t.account_id = accounts.id OR t.to_account_id = accounts.id
            )
            WHERE id = NEW.to_account_id;
        END IF;
    END IF;
    
    -- Para DELETE, usar OLD
    IF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET balance = (
            SELECT COALESCE(
                SUM(CASE 
                    WHEN t.type = 'income' THEN t.amount
                    WHEN t.type = 'expense' THEN -t.amount
                    WHEN t.type = 'transfer' AND t.account_id = accounts.id THEN -t.amount
                    WHEN t.type = 'transfer' AND t.to_account_id = accounts.id THEN t.amount
                    ELSE 0
                END), 0
            )
            FROM transactions_new t
            WHERE t.account_id = accounts.id OR t.to_account_id = accounts.id
        )
        WHERE id = OLD.account_id;
        
        IF OLD.to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = (
                SELECT COALESCE(
                    SUM(CASE 
                        WHEN t.type = 'income' THEN t.amount
                        WHEN t.type = 'expense' THEN -t.amount
                        WHEN t.type = 'transfer' AND t.account_id = accounts.id THEN -t.amount
                        WHEN t.type = 'transfer' AND t.to_account_id = accounts.id THEN t.amount
                        ELSE 0
                    END), 0
                )
                FROM transactions_new t
                WHERE t.account_id = accounts.id OR t.to_account_id = accounts.id
            )
            WHERE id = OLD.to_account_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions_new
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Trigger para refresh automático das views materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY account_balances;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_summaries;
    REFRESH MATERIALIZED VIEW CONCURRENTLY investment_portfolio;
    REFRESH MATERIALIZED VIEW CONCURRENTLY goal_progress;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para refresh das views (executar periodicamente)
-- Este será executado via cron job ou scheduler

-- FASE 7: VALIDAÇÃO E LIMPEZA FINAL
-- ============================================================================

-- Verificar integridade dos dados migrados
SELECT 'Users migrated: ' || COUNT(*) FROM users;
SELECT 'Accounts migrated: ' || COUNT(*) FROM accounts WHERE user_id IS NOT NULL;
SELECT 'Transactions migrated: ' || COUNT(*) FROM transactions_new;
SELECT 'Goals migrated: ' || COUNT(*) FROM goals WHERE user_id IS NOT NULL;
SELECT 'Investments migrated: ' || COUNT(*) FROM investments WHERE user_id IS NOT NULL;
SELECT 'Trips migrated: ' || COUNT(*) FROM trips WHERE user_id IS NOT NULL;

-- Verificar saldos das contas
SELECT 'Accounts with balance: ' || COUNT(*) FROM accounts WHERE balance != 0;

-- Após validação, renomear tabelas
-- DROP TABLE transactions; -- Fazer backup primeiro
-- ALTER TABLE transactions_new RENAME TO transactions;
-- DROP TABLE categories; -- Fazer backup primeiro  
-- ALTER TABLE categories_new RENAME TO categories;

COMMIT;
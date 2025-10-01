-- =====================================================
-- SISTEMA FINANCEIRO COMPLETO - SCHEMA POSTGRESQL
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE CATEGORIAS
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- Para subcategorias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, parent_id)
);

-- =====================================================
-- TABELA DE CONTAS BANCÁRIAS
-- =====================================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('checking', 'savings', 'investment', 'cash')),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    agency VARCHAR(20),
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE CARTÕES DE CRÉDITO
-- =====================================================
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    last_four_digits VARCHAR(4),
    credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00, -- Valor usado
    available_limit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
    closing_day INTEGER CHECK (closing_day >= 1 AND closing_day <= 31),
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE TRANSAÇÕES
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Dados da transação
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    transaction_date DATE NOT NULL,
    
    -- Para transferências
    transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    transfer_group_id UUID, -- Agrupa transações de transferência
    
    -- Dados adicionais
    notes TEXT,
    tags TEXT[], -- Array de tags
    location VARCHAR(255),
    receipt_url TEXT,
    
    -- Parcelamento
    installment_number INTEGER DEFAULT 1,
    total_installments INTEGER DEFAULT 1,
    installment_group_id UUID, -- Agrupa parcelas
    
    -- Recorrência
    is_recurring BOOLEAN DEFAULT false,
    recurring_type VARCHAR(20) CHECK (recurring_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    recurring_interval INTEGER DEFAULT 1,
    recurring_end_date DATE,
    recurring_group_id UUID, -- Agrupa transações recorrentes
    
    -- Controle
    is_confirmed BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_account_or_card CHECK (
        (account_id IS NOT NULL AND credit_card_id IS NULL) OR
        (account_id IS NULL AND credit_card_id IS NOT NULL)
    ),
    CONSTRAINT check_transfer_account CHECK (
        (type = 'transfer' AND transfer_to_account_id IS NOT NULL) OR
        (type != 'transfer' AND transfer_to_account_id IS NULL)
    )
);

-- =====================================================
-- TABELA DE ORÇAMENTOS
-- =====================================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE METAS FINANCEIRAS
-- =====================================================
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    category VARCHAR(50),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE ALERTAS
-- =====================================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL CHECK (type IN ('low_balance', 'high_credit_usage', 'budget_exceeded', 'goal_deadline', 'custom')),
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE LOGS DE AUDITORIA
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Categorias
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Contas
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_active ON accounts(is_active);

-- Cartões
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_active ON credit_cards(is_active);

-- Transações
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_credit_card_id ON transactions(credit_card_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_transfer_group ON transactions(transfer_group_id);
CREATE INDEX idx_transactions_installment_group ON transactions(installment_group_id);
CREATE INDEX idx_transactions_recurring_group ON transactions(recurring_group_id);
CREATE INDEX idx_transactions_deleted ON transactions(is_deleted);

-- Orçamentos
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_budgets_active ON budgets(is_active);

-- Metas
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_completed ON financial_goals(is_completed);

-- Alertas
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_active ON alerts(is_active);
CREATE INDEX idx_alerts_read ON alerts(is_read);

-- Auditoria
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER PARA ATUALIZAÇÃO DE SALDO DAS CONTAS
-- =====================================================

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Para inserção de nova transação
    IF TG_OP = 'INSERT' THEN
        -- Atualizar conta de origem
        IF NEW.account_id IS NOT NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'transfer' THEN
                UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
                -- Atualizar conta de destino
                IF NEW.transfer_to_account_id IS NOT NULL THEN
                    UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
                END IF;
            END IF;
        END IF;
        
        -- Atualizar saldo do cartão de crédito
        IF NEW.credit_card_id IS NOT NULL AND NEW.type = 'expense' THEN
            UPDATE credit_cards SET current_balance = current_balance + NEW.amount WHERE id = NEW.credit_card_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Para atualização de transação
    IF TG_OP = 'UPDATE' THEN
        -- Reverter valores antigos
        IF OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'transfer' THEN
                UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
                IF OLD.transfer_to_account_id IS NOT NULL THEN
                    UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
                END IF;
            END IF;
        END IF;
        
        IF OLD.credit_card_id IS NOT NULL AND OLD.type = 'expense' THEN
            UPDATE credit_cards SET current_balance = current_balance - OLD.amount WHERE id = OLD.credit_card_id;
        END IF;
        
        -- Aplicar novos valores
        IF NEW.account_id IS NOT NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'transfer' THEN
                UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
                IF NEW.transfer_to_account_id IS NOT NULL THEN
                    UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
                END IF;
            END IF;
        END IF;
        
        IF NEW.credit_card_id IS NOT NULL AND NEW.type = 'expense' THEN
            UPDATE credit_cards SET current_balance = current_balance + NEW.amount WHERE id = NEW.credit_card_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Para exclusão de transação
    IF TG_OP = 'DELETE' THEN
        -- Reverter valores
        IF OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'transfer' THEN
                UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
                IF OLD.transfer_to_account_id IS NOT NULL THEN
                    UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
                END IF;
            END IF;
        END IF;
        
        IF OLD.credit_card_id IS NOT NULL AND OLD.type = 'expense' THEN
            UPDATE credit_cards SET current_balance = current_balance - OLD.amount WHERE id = OLD.credit_card_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para atualização de saldos
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- =====================================================
-- TRIGGER PARA AUDITORIA
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoria
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_accounts AFTER INSERT OR UPDATE OR DELETE ON accounts FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_credit_cards AFTER INSERT OR UPDATE OR DELETE ON credit_cards FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para saldo consolidado por usuário
CREATE VIEW user_balance_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    COALESCE(SUM(a.current_balance), 0) as total_account_balance,
    COALESCE(SUM(cc.current_balance), 0) as total_credit_card_debt,
    COALESCE(SUM(a.current_balance), 0) - COALESCE(SUM(cc.current_balance), 0) as net_worth
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id AND a.is_active = true
LEFT JOIN credit_cards cc ON u.id = cc.user_id AND cc.is_active = true
WHERE u.is_active = true
GROUP BY u.id, u.first_name, u.last_name;

-- View para transações com detalhes
CREATE VIEW transaction_details AS
SELECT 
    t.*,
    u.first_name || ' ' || u.last_name as user_name,
    a.name as account_name,
    cc.name as credit_card_name,
    c.name as category_name,
    ta.name as transfer_to_account_name
FROM transactions t
JOIN users u ON t.user_id = u.id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts ta ON t.transfer_to_account_id = ta.id
WHERE t.is_deleted = false;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE categories IS 'Categorias e subcategorias de transações';
COMMENT ON TABLE accounts IS 'Contas bancárias dos usuários';
COMMENT ON TABLE credit_cards IS 'Cartões de crédito dos usuários';
COMMENT ON TABLE transactions IS 'Todas as transações financeiras';
COMMENT ON TABLE budgets IS 'Orçamentos definidos pelos usuários';
COMMENT ON TABLE financial_goals IS 'Metas financeiras dos usuários';
COMMENT ON TABLE alerts IS 'Sistema de alertas e notificações';
COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as operações';

COMMENT ON COLUMN transactions.transfer_group_id IS 'Agrupa transações de transferência (débito e crédito)';
COMMENT ON COLUMN transactions.installment_group_id IS 'Agrupa parcelas de uma mesma compra';
COMMENT ON COLUMN transactions.recurring_group_id IS 'Agrupa transações recorrentes';
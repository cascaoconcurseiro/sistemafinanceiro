-- ============================================
-- MIGRAÇÃO: Regras Financeiras Avançadas
-- Data: 28/10/2025
-- ============================================

-- 1. ADICIONAR CAMPOS NO ACCOUNT (Cheque Especial)
ALTER TABLE accounts ADD COLUMN allow_negative_balance BOOLEAN DEFAULT 0;
ALTER TABLE accounts ADD COLUMN overdraft_limit DECIMAL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN overdraft_interest_rate DECIMAL;

-- 2. ADICIONAR CAMPOS NO CREDIT_CARD (Limite Excedido)
ALTER TABLE credit_cards ADD COLUMN allow_over_limit BOOLEAN DEFAULT 0;
ALTER TABLE credit_cards ADD COLUMN over_limit_percent INTEGER DEFAULT 0;
ALTER TABLE credit_cards ADD COLUMN brand STRING;
ALTER TABLE credit_cards ADD COLUMN last_four_digits STRING;

-- 3. ADICIONAR CAMPOS NO INSTALLMENT (Antecipação)
ALTER TABLE installments ADD COLUMN can_anticipate BOOLEAN DEFAULT 1;
ALTER TABLE installments ADD COLUMN anticipated_at DATETIME;
ALTER TABLE installments ADD COLUMN discount_applied DECIMAL DEFAULT 0;
ALTER TABLE installments ADD COLUMN original_amount DECIMAL;

-- 4. ADICIONAR CAMPOS NO INVOICE (Rotativo)
ALTER TABLE invoices ADD COLUMN minimum_payment DECIMAL;
ALTER TABLE invoices ADD COLUMN is_rotativo BOOLEAN DEFAULT 0;
ALTER TABLE invoices ADD COLUMN rotativo_interest_rate DECIMAL DEFAULT 15.0;
ALTER TABLE invoices ADD COLUMN remaining_balance DECIMAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN previous_balance DECIMAL DEFAULT 0;

-- 5. ADICIONAR CAMPOS NO INVOICE_PAYMENT (Estorno)
ALTER TABLE invoice_payments ADD COLUMN status STRING DEFAULT 'completed';
ALTER TABLE invoice_payments ADD COLUMN reversed_at DATETIME;
ALTER TABLE invoice_payments ADD COLUMN reversal_reason STRING;
ALTER TABLE invoice_payments ADD COLUMN original_payment_id STRING;

-- 6. CRIAR TABELA INSTALLMENT (se não existir)
CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATETIME NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at DATETIME,
  description TEXT,
  can_anticipate BOOLEAN DEFAULT 1,
  anticipated_at DATETIME,
  discount_applied DECIMAL DEFAULT 0,
  original_amount DECIMAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_user_id ON installments(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_status ON invoice_payments(status);

-- 8. CRIAR TABELA INVOICE (se não existir)
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  credit_card_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_amount DECIMAL DEFAULT 0,
  paid_amount DECIMAL DEFAULT 0,
  minimum_payment DECIMAL,
  due_date DATETIME NOT NULL,
  is_paid BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'open',
  is_rotativo BOOLEAN DEFAULT 0,
  rotativo_interest_rate DECIMAL DEFAULT 15.0,
  remaining_balance DECIMAL DEFAULT 0,
  previous_balance DECIMAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. CRIAR ÍNDICES PARA INVOICE
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_card_month_year ON invoices(credit_card_id, month, year);

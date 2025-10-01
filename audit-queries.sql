-- AUDITORIA COMPLETA DO BANCO DE DADOS SUAGRANA
-- ============================================

-- 1. Verificar estrutura das tabelas principais
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2. Verificar dados de contas
SELECT 
  id, 
  name, 
  balance, 
  isActive, 
  createdAt 
FROM accounts 
ORDER BY createdAt;

-- 3. Verificar transações
SELECT 
  id, 
  description, 
  amount, 
  type, 
  accountId, 
  date, 
  createdAt 
FROM transactions 
ORDER BY date DESC 
LIMIT 20;

-- 4. Verificar relacionamentos Account <-> Transaction
SELECT 
  a.name as conta, 
  a.balance as saldo_conta, 
  COUNT(t.id) as num_transacoes, 
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as receitas, 
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as despesas, 
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as saldo_calculado 
FROM accounts a 
LEFT JOIN transactions t ON a.id = t.accountId 
WHERE a.isActive = 1 
GROUP BY a.id, a.name, a.balance 
ORDER BY a.name;

-- 5. Verificar totais gerais
SELECT 
  'CONTAS' as tipo,
  COUNT(*) as quantidade,
  SUM(balance) as total
FROM accounts 
WHERE isActive = 1
UNION ALL
SELECT 
  'TRANSACOES' as tipo,
  COUNT(*) as quantidade,
  SUM(amount) as total
FROM transactions;

-- 6. Verificar tipos de transações
SELECT 
  type,
  COUNT(*) as quantidade,
  SUM(amount) as total
FROM transactions 
GROUP BY type;
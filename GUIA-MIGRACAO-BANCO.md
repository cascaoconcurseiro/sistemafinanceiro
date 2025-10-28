# 🗄️ Guia de Migração do Banco de Dados

**Data:** 28/10/2025  
**Versão:** 2.0.0  

---

## 🎯 Objetivo

Aplicar as mudanças no banco de dados para suportar o novo sistema financeiro com:
- ✅ Partidas dobradas (JournalEntry)
- ✅ Faturas de cartão (Invoice)
- ✅ Parcelamentos (Installment)
- ✅ Pagamentos (InvoicePayment, DebtPayment)

---

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

### Backup Obrigatório
**SEMPRE faça backup do banco antes de aplicar migrations!**

```bash
# Backup manual
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d)

# Ou use o script que faz backup automaticamente
```

### Tempo Estimado
- **Pequeno banco** (< 1000 transações): 1-2 minutos
- **Médio banco** (1000-10000 transações): 5-10 minutos
- **Grande banco** (> 10000 transações): 15-30 minutos

---

## 🚀 OPÇÃO 1: Script Automático (Recomendado)

### Windows (PowerShell)
```powershell
.\scripts\apply-migration.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/apply-migration.sh
./scripts/apply-migration.sh
```

O script automático faz:
1. ✅ Backup do banco
2. ✅ Gera cliente Prisma
3. ✅ Aplica migration
4. ✅ Verifica integridade
5. ✅ Executa migração de dados

---

## 🔧 OPÇÃO 2: Passo a Passo Manual

### 1. Fazer Backup
```bash
# Windows
copy prisma\dev.db prisma\dev.db.backup

# Linux/Mac
cp prisma/dev.db prisma/dev.db.backup
```

### 2. Gerar Cliente Prisma
```bash
npx prisma generate
```

### 3. Aplicar Migration
```bash
npx prisma migrate deploy
```

### 4. Verificar Schema
```bash
npx prisma validate
```

### 5. Executar Migração de Dados
```bash
npx ts-node scripts/migrate-financial-data.ts
```

### 6. Verificar Integridade
```bash
curl http://localhost:3000/api/maintenance/verify-integrity
```

### 7. Recalcular Saldos
```bash
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances
```

---

## 📊 O QUE A MIGRATION FAZ

### Novas Tabelas Criadas

#### 1. journal_entries (Partidas Dobradas)
```sql
- id: Identificador único
- transaction_id: Vínculo com transação
- account_id: Conta afetada
- entry_type: 'DEBITO' ou 'CREDITO'
- amount: Valor do lançamento
- description: Descrição
- created_at: Data de criação
```

#### 2. invoices (Faturas de Cartão)
```sql
- id: Identificador único
- credit_card_id: Cartão vinculado
- user_id: Usuário dono
- month: Mês da fatura
- year: Ano da fatura
- total_amount: Valor total
- paid_amount: Valor pago
- due_date: Data de vencimento
- is_paid: Se está paga
- status: 'open' | 'partial' | 'paid' | 'overdue'
```

#### 3. installments (Parcelas)
```sql
- id: Identificador único
- transaction_id: Transação pai
- user_id: Usuário dono
- installment_number: Número da parcela
- total_installments: Total de parcelas
- amount: Valor da parcela
- due_date: Data de vencimento
- status: 'pending' | 'paid' | 'cancelled' | 'overdue'
```

#### 4. invoice_payments (Pagamentos de Fatura)
```sql
- id: Identificador único
- invoice_id: Fatura paga
- user_id: Usuário
- account_id: Conta usada
- amount: Valor pago
- payment_date: Data do pagamento
```

#### 5. debt_payments (Pagamentos de Dívida)
```sql
- id: Identificador único
- user_id: Usuário
- contact_id: Contato
- amount: Valor pago
- paid_date: Data do pagamento
- debts_affected: JSON com dívidas afetadas
```

### Campos Adicionados

#### transactions
- `invoice_id`: Vínculo com fatura do cartão
- `my_share`: Minha parte em despesas compartilhadas
- `metadata`: JSON com dados adicionais

#### accounts
- `balance`: Saldo da conta (se não existia)

### Índices Criados
- Índices para melhor performance em queries
- Índices compostos para filtros comuns
- Índices para foreign keys

---

## 🔍 Verificação Pós-Migration

### 1. Verificar Tabelas Criadas
```bash
npx prisma studio
```

Verifique se as novas tabelas aparecem:
- journal_entries
- invoices
- installments
- invoice_payments
- debt_payments

### 2. Verificar Integridade
```bash
curl http://localhost:3000/api/maintenance/verify-integrity
```

Deve retornar:
```json
{
  "hasIssues": false,
  "issuesCount": 0,
  "issues": []
}
```

### 3. Verificar Saldos
```bash
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances
```

Deve retornar lista de contas com saldos recalculados.

### 4. Testar APIs
```bash
# Criar transação
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-id",
    "amount": 100,
    "description": "Teste",
    "type": "RECEITA",
    "date": "2025-10-28T10:00:00Z"
  }'
```

---

## 🚨 Problemas Comuns

### Erro: "Table already exists"
**Causa:** Migration já foi aplicada  
**Solução:** Não precisa fazer nada, está OK

### Erro: "Foreign key constraint failed"
**Causa:** Dados inconsistentes no banco  
**Solução:** 
```bash
npx ts-node scripts/migrate-financial-data.ts
```

### Erro: "Column not found"
**Causa:** Schema desatualizado  
**Solução:**
```bash
npx prisma generate
npx prisma migrate deploy
```

### Saldos Incorretos
**Causa:** Partidas dobradas faltantes  
**Solução:**
```bash
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances
```

---

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode voltar ao backup:

```bash
# 1. Parar o servidor
# Ctrl+C

# 2. Restaurar backup
# Windows
copy prisma\dev.db.backup prisma\dev.db

# Linux/Mac
cp prisma/dev.db.backup prisma/dev.db

# 3. Reiniciar servidor
npm run dev
```

---

## ✅ Checklist Final

Após aplicar a migration, verifique:

- [ ] Backup do banco foi criado
- [ ] Migration aplicada sem erros
- [ ] Novas tabelas criadas
- [ ] Campos adicionados
- [ ] Índices criados
- [ ] Integridade verificada (0 problemas)
- [ ] Saldos recalculados
- [ ] APIs testadas e funcionando
- [ ] Sistema rodando sem erros

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Execute o script de migração de dados
3. Verifique integridade
4. Consulte TROUBLESHOOTING.md
5. Restaure o backup se necessário

---

**Versão:** 2.0.0  
**Data:** 28/10/2025  
**Status:** ✅ PRONTO PARA USO

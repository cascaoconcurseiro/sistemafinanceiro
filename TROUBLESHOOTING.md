# 🔧 Guia de Troubleshooting

Soluções para problemas comuns no sistema financeiro.

---

## 🚨 Problemas Comuns

### 1. Saldos Inconsistentes

**Sintoma:** Saldo da conta não bate com as transações

**Causa:** Partidas dobradas faltantes ou desbalanceadas

**Solução:**
```bash
# 1. Verificar integridade
curl http://localhost:3000/api/maintenance/verify-integrity

# 2. Recalcular saldos
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances

# 3. Se persistir, executar migração
npx ts-node scripts/migrate-financial-data.ts
```

---

### 2. Erro "Saldo Insuficiente"

**Sintoma:** Não consegue criar despesa mesmo com saldo

**Causa:** Saldo calculado incorretamente

**Solução:**
```typescript
// 1. Verificar saldo real
const account = await prisma.account.findUnique({
  where: { id: accountId },
  include: {
    journalEntries: {
      where: { transaction: { deletedAt: null } }
    }
  }
});

// 2. Recalcular manualmente
const balance = account.journalEntries.reduce((sum, entry) => {
  return entry.entryType === 'DEBITO' 
    ? sum + Number(entry.amount)
    : sum - Number(entry.amount);
}, 0);

// 3. Atualizar
await prisma.account.update({
  where: { id: accountId },
  data: { balance }
});
```

---

### 3. Transações Órfãs

**Sintoma:** Transações sem conta ou cartão

**Causa:** Dados corrompidos ou migração incompleta

**Solução:**
```bash
# Executar script de migração
npx ts-node scripts/migrate-financial-data.ts
```

Ou manualmente:
```typescript
// Buscar órfãs
const orphans = await prisma.transaction.findMany({
  where: {
    accountId: null,
    creditCardId: null,
    deletedAt: null
  }
});

// Criar conta padrão
const defaultAccount = await prisma.account.create({
  data: {
    userId: 'user-id',
    name: 'Transações Antigas',
    type: 'ATIVO',
    balance: 0,
    currency: 'BRL',
    isActive: true
  }
});

// Vincular
await prisma.transaction.updateMany({
  where: { id: { in: orphans.map(t => t.id) } },
  data: { accountId: defaultAccount.id }
});
```

---

### 4. Partidas Dobradas Desbalanceadas

**Sintoma:** Débito ≠ Crédito

**Causa:** Lançamentos deletados ou corrompidos

**Solução:**
```typescript
// 1. Verificar integridade
const result = await FinancialOperationsService.verifyDoubleEntryIntegrity(userId);

// 2. Para cada transação desbalanceada
for (const issue of result.issues) {
  // Deletar lançamentos existentes
  await prisma.journalEntry.deleteMany({
    where: { transactionId: issue.transactionId }
  });
  
  // Recriar partidas dobradas
  const transaction = await prisma.transaction.findUnique({
    where: { id: issue.transactionId }
  });
  
  await createJournalEntriesForTransaction(transaction);
}
```

---

### 5. Faturas Sem Transações

**Sintoma:** Fatura criada mas sem transações vinculadas

**Causa:** Transações criadas antes do vínculo automático

**Solução:**
```bash
# Executar migração para vincular
npx ts-node scripts/migrate-financial-data.ts
```

---

### 6. Erro "Transaction already exists"

**Sintoma:** Duplicação de transações

**Causa:** Retry automático ou double-click

**Solução:**
```typescript
// Implementar debounce no frontend
const createTransaction = debounce(async (data) => {
  await fetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}, 1000);

// Ou verificar duplicação no backend (já implementado)
```

---

### 7. Performance Lenta

**Sintoma:** APIs demoram muito

**Causa:** Muitas transações ou queries não otimizadas

**Solução:**
```typescript
// 1. Adicionar índices no banco
await prisma.$executeRaw`
  CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON "Transaction" ("userId", "date" DESC);
`;

// 2. Usar paginação
const transactions = await prisma.transaction.findMany({
  where: { userId },
  take: 50,
  skip: page * 50,
  orderBy: { date: 'desc' }
});

// 3. Usar cache
const cached = await redis.get(`transactions:${userId}`);
if (cached) return JSON.parse(cached);
```

---

## 🔍 Diagnóstico

### Verificar Integridade Completa

```bash
# 1. Verificar partidas dobradas
curl http://localhost:3000/api/maintenance/verify-integrity

# 2. Verificar saldos
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances

# 3. Verificar transações órfãs
npx prisma studio
# Filtrar: accountId = null AND creditCardId = null

# 4. Verificar faturas
# Buscar transações de cartão sem invoiceId
```

### Logs Úteis

```typescript
// Habilitar logs detalhados
console.log('🔍 [Debug] Transaction:', transaction);
console.log('🔍 [Debug] Journal Entries:', entries);
console.log('🔍 [Debug] Balance:', balance);
```

---

## 🛠️ Ferramentas

### Prisma Studio
```bash
npx prisma studio
```
Visualizar e editar dados diretamente.

### Script de Migração
```bash
npx ts-node scripts/migrate-financial-data.ts
```
Corrige automaticamente problemas comuns.

### API de Manutenção
```bash
# Recalcular saldos
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances

# Verificar integridade
curl http://localhost:3000/api/maintenance/verify-integrity
```

---

## 📞 Suporte

Se o problema persistir:

1. **Verificar logs do servidor**
2. **Executar script de migração**
3. **Verificar integridade**
4. **Criar issue no GitHub** com:
   - Descrição do problema
   - Passos para reproduzir
   - Logs relevantes
   - Versão do sistema

---

## 🔄 Rollback

Se precisar reverter mudanças:

```bash
# 1. Backup do banco
pg_dump database_name > backup.sql

# 2. Restaurar versão anterior
git checkout v1.0.0

# 3. Executar migrations antigas
npx prisma migrate deploy

# 4. Restaurar dados se necessário
psql database_name < backup.sql
```

---

**Versão:** 2.0.0  
**Última atualização:** 28/10/2025

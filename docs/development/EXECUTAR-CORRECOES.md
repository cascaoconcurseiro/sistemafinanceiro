# 🔧 EXECUTAR CORREÇÕES CRÍTICAS

## ⚡ EXECUÇÃO RÁPIDA (3 comandos)

```bash
# 1. Entrar na pasta do projeto
cd "Não apagar/SuaGrana-Clean"

# 2. Executar migration (tornar categoria obrigatória)
npx prisma migrate dev --name fix-category-required

# 3. Testar correções
node scripts/apply-critical-fixes.js
```

---

## 📋 PASSO A PASSO DETALHADO

### Passo 1: Preparar Dados (Opcional)

Se houver transações sem categoria, execute primeiro:

```bash
node scripts/make-category-required.ts
```

Isso vai:
- Criar categoria "Sem Categoria" se não existir
- Atribuir essa categoria a todas transações sem categoria

### Passo 2: Executar Migration

```bash
npx prisma migrate dev --name fix-category-required
```

O que acontece:
- ✅ Prisma detecta que `categoryId` agora é obrigatório
- ✅ Cria migration SQL
- ✅ Aplica no banco de dados
- ✅ Regenera Prisma Client

**Saída esperada:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

✔ Enter a name for the new migration: … fix-category-required
Applying migration `20241122_fix_category_required`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241122_fix_category_required/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Passo 3: Testar Sistema

```bash
node scripts/apply-critical-fixes.js
```

O script vai testar:
1. ✅ Partidas dobradas balanceadas
2. ✅ Categorias obrigatórias
3. ✅ Soft delete funcionando
4. ✅ Saldos corretos
5. ✅ Idempotência ativa

**Saída esperada:**
```
🔧 APLICANDO CORREÇÕES CRÍTICAS

📊 TESTE 1: Verificando Partidas Dobradas
Encontradas 10 transações
✅ Almoço: Débito=100, Crédito=100
✅ Supermercado: Débito=250, Crédito=250
...
📊 Resultado: 10 balanceadas, 0 desbalanceadas

📂 TESTE 2: Verificando Categorias Obrigatórias
✅ Todas as transações têm categoria

🗑️ TESTE 3: Verificando Soft Delete
✅ Transações ativas: 150
✅ Transações deletadas (preservadas): 5

💰 TESTE 4: Verificando Saldos
✅ Conta Corrente: Saldo OK (R$ 1500.00)
✅ Poupança: Saldo OK (R$ 5000.00)

🔒 TESTE 5: Verificando Idempotência
✅ 120 de 150 transações têm UUID (80.0%)

==================================================
📊 RESUMO DAS CORREÇÕES
==================================================
✅ Partidas Dobradas: 10/10 balanceadas
✅ Categorias: Todas obrigatórias
✅ Soft Delete: 5 transações preservadas
✅ Idempotência: 80.0% com UUID
==================================================

🎉 SISTEMA 100% CORRIGIDO!
```

---

## 🚨 PROBLEMAS COMUNS

### Erro: "Transações sem categoria"

**Problema:**
```
Error: Foreign key constraint failed on the field: `category_id`
```

**Solução:**
```bash
# 1. Executar script de correção
node scripts/make-category-required.ts

# 2. Tentar migration novamente
npx prisma migrate dev --name fix-category-required
```

### Erro: "Migration já existe"

**Problema:**
```
Error: Migration `fix-category-required` already exists
```

**Solução:**
```bash
# Usar outro nome
npx prisma migrate dev --name fix-category-required-v2
```

### Erro: "Prisma Client desatualizado"

**Problema:**
```
Error: Prisma Client is not up to date
```

**Solução:**
```bash
npx prisma generate
```

---

## 📊 VERIFICAÇÃO MANUAL

### Verificar Partidas Dobradas

```sql
-- Abrir banco de dados
sqlite3 prisma/dev.db

-- Verificar lançamentos de uma transação
SELECT 
  t.description,
  je.entry_type,
  je.amount,
  a.name as account_name
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
JOIN accounts a ON je.account_id = a.id
WHERE t.id = 'TRANSACTION_ID_AQUI'
ORDER BY je.entry_type;

-- Deve mostrar:
-- CREDITO | 100.00 | Conta Corrente
-- DEBITO  | 100.00 | Alimentação
```

### Verificar Saldo Calculado

```sql
-- Saldo de uma conta baseado em lançamentos
SELECT 
  a.name,
  a.balance as stored_balance,
  SUM(CASE WHEN je.entry_type = 'DEBITO' THEN je.amount ELSE -je.amount END) as calculated_balance
FROM accounts a
LEFT JOIN journal_entries je ON je.account_id = a.id
LEFT JOIN transactions t ON je.transaction_id = t.id
WHERE t.deleted_at IS NULL
GROUP BY a.id;
```

---

## 🎯 RESULTADO ESPERADO

Após executar todas as correções:

### ✅ Antes vs Depois

| Aspecto | Antes ❌ | Depois ✅ |
|---------|---------|----------|
| **Partidas Dobradas** | Não usadas | Ativas e balanceadas |
| **Validações** | Ausentes | Rigorosas |
| **Categoria** | Opcional | Obrigatória |
| **Delete** | Físico | Soft delete |
| **Atomicidade** | Parcial | Garantida |
| **Saldo** | Manual | Automático |
| **Idempotência** | Não | Sim |

### 📈 Melhorias Quantificáveis

- **Integridade:** 100% das transações balanceadas
- **Rastreabilidade:** 100% das transações com categoria
- **Segurança:** 0% de perda de histórico
- **Confiabilidade:** 100% de atomicidade
- **Duplicação:** 0% com idempotência

---

## 🆘 SUPORTE

Se encontrar problemas:

1. Verificar logs do script de teste
2. Consultar `docs/STATUS-CORRECOES-CRITICAS.md`
3. Verificar `docs/PROBLEMAS-E-SOLUCOES.md`
4. Executar `node scripts/apply-critical-fixes.js` novamente

---

**Última atualização:** 22/11/2024  
**Status:** Pronto para execução

# 🔄 Migração: Adicionar goalId em Transações Antigas

## 🎯 Problema

Transações criadas antes da correção não têm `goalId`, então:
- ❌ Não aparecem no histórico da meta
- ❌ Não são contabilizadas corretamente
- ❌ Não podem ser gerenciadas pela meta

## ✅ Solução

### 1. Correção do Saldo (JÁ APLICADA)
**Arquivo:** `src/lib/services/double-entry-service.ts`

Corrigido o método `updateAccountBalance` para **excluir transações deletadas** do cálculo:

```typescript
// Filtrar apenas transações confirmadas E NÃO DELETADAS
const validEntries = entries.filter(e => 
  e.transaction && 
  e.transaction.status === 'cleared' && 
  e.transaction.deletedAt === null  // ✅ NOVO
);
```

**Resultado:**
- ✅ Ao deletar transação, o saldo volta corretamente
- ✅ Transações deletadas não afetam mais o saldo

### 2. Script de Migração
**Arquivo:** `scripts/migrate-goal-transactions.js`

Script que:
1. Busca todas as metas ativas
2. Para cada meta, encontra transações que mencionam ela na descrição
3. Atualiza essas transações com o `goalId` correto
4. Reporta transações órfãs que precisam de revisão manual

## 🚀 Como Executar

### Opção 1: Executar o Script (Recomendado)

```bash
cd "Não apagar/SuaGrana-Clean"
node scripts/migrate-goal-transactions.js
```

**O que o script faz:**
- ✅ Identifica transações pela descrição (ex: "Meta: carro")
- ✅ Atualiza com o goalId correto
- ✅ Mostra relatório detalhado
- ✅ Lista transações órfãs para revisão manual

### Opção 2: Migração Manual via Prisma Studio

```bash
cd "Não apagar/SuaGrana-Clean"
npx prisma studio
```

1. Abra a tabela `Transaction`
2. Filtre por `goalId = null`
3. Para cada transação de meta, adicione o `goalId` manualmente

### Opção 3: SQL Direto (Avançado)

```sql
-- Ver transações sem goalId que podem ser de metas
SELECT id, description, amount, date 
FROM Transaction 
WHERE goalId IS NULL 
  AND deletedAt IS NULL 
  AND (description LIKE '%Meta:%' OR description LIKE '%meta%');

-- Atualizar transações de uma meta específica
UPDATE Transaction 
SET goalId = 'ID_DA_META_AQUI'
WHERE description LIKE '%Meta: carro%' 
  AND goalId IS NULL 
  AND deletedAt IS NULL;
```

## 📊 Exemplo de Saída do Script

```
🔄 Iniciando migração de transações de metas...

📊 Encontradas 2 metas ativas

🎯 Processando meta: carro (abc123)
   Valor atual: R$ 50,00
   📝 Encontradas 1 transações para migrar:
      - Investimento na meta: carro
        Valor: R$ 50,00
        Conta: Nubank
        Data: 26/10/2025
        ✅ Atualizada com goalId

🎯 Processando meta: viagem (def456)
   Valor atual: R$ 0,00
   ✅ Nenhuma transação para migrar

✅ Migração concluída!
📊 Total de transações atualizadas: 1
```

## ✅ Verificação Pós-Migração

Após executar o script:

1. **Abra a meta no sistema**
2. **Clique em "Histórico"**
3. **Verifique se as transações aparecem**
4. **Teste deletar uma transação**
5. **Confirme que o saldo volta corretamente**

## 🔍 Troubleshooting

### Transações não aparecem após migração

**Causa:** O frontend pode estar com cache
**Solução:** Recarregue a página (F5)

### Script não encontra transações

**Causa:** A descrição não corresponde ao nome da meta
**Solução:** Verifique a descrição das transações no banco e ajuste o script

### Erro ao executar script

**Causa:** Prisma não configurado
**Solução:** 
```bash
cd "Não apagar/SuaGrana-Clean"
npx prisma generate
```

## 📝 Notas Importantes

- ✅ O script é **idempotente** (pode ser executado múltiplas vezes)
- ✅ Não afeta transações que já têm `goalId`
- ✅ Não deleta nenhum dado
- ✅ Apenas adiciona o `goalId` onde está faltando
- ⚠️  Faça backup do banco antes de executar (opcional mas recomendado)

## 🎯 Próximos Passos

Após a migração:
1. ✅ Todas as transações de metas terão `goalId`
2. ✅ Histórico funcionará corretamente
3. ✅ Exclusão reverterá saldos corretamente
4. ✅ Sistema totalmente funcional

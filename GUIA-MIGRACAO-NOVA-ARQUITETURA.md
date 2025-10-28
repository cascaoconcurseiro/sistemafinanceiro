# 📘 GUIA DE MIGRAÇÃO - NOVA ARQUITETURA MODULAR

## 🎯 Objetivo

Este guia ajuda a migrar código existente para usar a nova arquitetura modular de serviços.

---

## 🔄 ANTES vs DEPOIS

### Importação de Serviços

#### ❌ ANTES (Antigo - Ainda Funciona)
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

// Usar serviço monolítico
await FinancialOperationsService.createTransaction(options);
```

#### ✅ DEPOIS (Novo - Recomendado)
```typescript
import { TransactionCreator } from '@/lib/services/transactions';

// Usar módulo específico
await TransactionCreator.create(options);
```

---

## 📚 GUIA DE MIGRAÇÃO POR FUNCIONALIDADE

### 1. Criar Transação Simples

#### ❌ Código Antigo:
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

const result = await FinancialOperationsService.createTransaction({
  transaction: {
    userId: 'user123',
    amount: 100,
    description: 'Compra',
    type: 'DESPESA',
    date: new Date(),
  },
  createJournalEntries: true,
  linkToInvoice: true,
});
```

#### ✅ Código Novo:
```typescript
import { TransactionCreator } from '@/lib/services/transactions';

const result = await TransactionCreator.create({
  transaction: {
    userId: 'user123',
    amount: 100,
    description: 'Compra',
    type: 'DESPESA',
    date: new Date(),
  },
  createJournalEntries: true,
  linkToInvoice: true,
});
```

---

### 2. Criar Parcelamento

#### ❌ Código Antigo:
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

const result = await FinancialOperationsService.createInstallments({
  baseTransaction: {
    userId: 'user123',
    amount: 1200,
    description: 'Notebook',
    type: 'DESPESA',
    date: new Date(),
  },
  totalInstallments: 12,
  firstDueDate: new Date(),
  frequency: 'monthly',
});
```

#### ✅ Código Novo:
```typescript
import { InstallmentCreator } from '@/lib/services/transactions';

const result = await InstallmentCreator.create({
  baseTransaction: {
    userId: 'user123',
    amount: 1200,
    description: 'Notebook',
    type: 'DESPESA',
    date: new Date(),
  },
  totalInstallments: 12,
  firstDueDate: new Date(),
  frequency: 'monthly',
});
```

---

### 3. Criar Transferência

#### ❌ Código Antigo:
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

const result = await FinancialOperationsService.createTransfer({
  fromAccountId: 'acc1',
  toAccountId: 'acc2',
  amount: 500,
  description: 'Transferência',
  date: new Date(),
  userId: 'user123',
});
```

#### ✅ Código Novo:
```typescript
import { TransferCreator } from '@/lib/services/transactions';

const result = await TransferCreator.create({
  fromAccountId: 'acc1',
  toAccountId: 'acc2',
  amount: 500,
  description: 'Transferência',
  date: new Date(),
  userId: 'user123',
});
```

---

### 4. Validar Limite de Cartão

#### ❌ Código Antigo:
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

await FinancialOperationsService.validateCreditCardLimit(cardId, 1000);
```

#### ✅ Código Novo:
```typescript
import { TransactionValidator } from '@/lib/services/transactions';

await TransactionValidator.validateCreditCardLimit(cardId, 1000);
```

---

### 5. Validar Saldo de Conta

#### ❌ Código Antigo:
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

await FinancialOperationsService.validateAccountBalance(accountId, 500);
```

#### ✅ Código Novo:
```typescript
import { TransactionValidator } from '@/lib/services/transactions';

await TransactionValidator.validateAccountBalance(accountId, 500);
```

---

### 6. Recalcular Saldos

#### ❌ Código Antigo:
```typescript
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

await FinancialOperationsService.recalculateAllBalances(userId);
```

#### ✅ Código Novo:
```typescript
import { BalanceCalculator } from '@/lib/services/calculations';

await BalanceCalculator.recalculateAllBalances(userId);
```

---

## 🎨 PADRÕES DE USO

### Padrão 1: Import Específico (Recomendado)

```typescript
// Importar apenas o que precisa
import { TransactionCreator } from '@/lib/services/transactions';
import { BalanceCalculator } from '@/lib/services/calculations';

// Usar diretamente
await TransactionCreator.create(options);
await BalanceCalculator.recalculateAllBalances(userId);
```

**Vantagens**:
- Bundle menor (tree-shaking)
- Código mais claro
- Melhor performance

---

### Padrão 2: Import Agrupado

```typescript
// Importar múltiplos módulos
import {
  TransactionCreator,
  InstallmentCreator,
  TransferCreator,
} from '@/lib/services/transactions';

// Usar conforme necessário
await TransactionCreator.create(options);
await InstallmentCreator.create(installmentOptions);
```

**Vantagens**:
- Organização clara
- Fácil de ver dependências
- Bom para arquivos grandes

---

### Padrão 3: Compatibilidade (Temporário)

```typescript
// Usar orquestrador para compatibilidade
import { FinancialOperationsService } from '@/lib/services/financial-operations-orchestrator';

// Funciona igual ao antigo
await FinancialOperationsService.createTransaction(options);
```

**Quando usar**:
- Migração gradual
- Código legado
- Testes de compatibilidade

---

## 🔧 MIGRAÇÃO PASSO A PASSO

### Passo 1: Identificar Uso do Serviço Antigo

```bash
# Procurar imports do serviço antigo
grep -r "financial-operations-service" src/
```

### Passo 2: Analisar Métodos Usados

```typescript
// Exemplo de arquivo a migrar
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';

// Método 1: createTransaction
await FinancialOperationsService.createTransaction(options);

// Método 2: validateCreditCardLimit
await FinancialOperationsService.validateCreditCardLimit(cardId, amount);
```

### Passo 3: Substituir Imports

```typescript
// Novo import específico
import { TransactionCreator } from '@/lib/services/transactions';
import { TransactionValidator } from '@/lib/services/transactions';

// Método 1: createTransaction → TransactionCreator.create
await TransactionCreator.create(options);

// Método 2: validateCreditCardLimit → TransactionValidator.validateCreditCardLimit
await TransactionValidator.validateCreditCardLimit(cardId, amount);
```

### Passo 4: Testar

```typescript
// Executar testes
npm test

// Verificar funcionalidade manualmente
// Testar criação de transação
// Testar validações
// Testar cálculos
```

---

## 📊 TABELA DE REFERÊNCIA RÁPIDA

| Método Antigo | Módulo Novo | Método Novo |
|---------------|-------------|-------------|
| `createTransaction()` | `TransactionCreator` | `create()` |
| `createInstallments()` | `InstallmentCreator` | `create()` |
| `createTransfer()` | `TransferCreator` | `create()` |
| `validateCreditCardLimit()` | `TransactionValidator` | `validateCreditCardLimit()` |
| `validateAccountBalance()` | `TransactionValidator` | `validateAccountBalance()` |
| `recalculateAllBalances()` | `BalanceCalculator` | `recalculateAllBalances()` |
| `updateAccountBalance()` | `BalanceCalculator` | `updateAccountBalance()` |
| `updateCreditCardBalance()` | `BalanceCalculator` | `updateCreditCardBalance()` |

---

## 🚨 AVISOS IMPORTANTES

### ⚠️ Não Migrado Ainda

Algumas funcionalidades ainda não foram migradas:

```typescript
// ❌ Ainda não implementado
createSharedExpense() // TODO: Criar SharedExpenseCreator
recalculateInvoiceTotal() // TODO: Criar InvoiceCalculator
recalculateTripSpent() // TODO: Criar TripCalculator
recalculateGoalAmount() // TODO: Criar GoalCalculator
recalculateBudgetSpent() // TODO: Criar BudgetCalculator
```

**Solução Temporária**: Use o orquestrador ou o serviço antigo para essas funcionalidades.

---

## ✅ CHECKLIST DE MIGRAÇÃO

### Para Cada Arquivo:

- [ ] Identificar imports do serviço antigo
- [ ] Mapear métodos usados
- [ ] Substituir por módulos específicos
- [ ] Atualizar imports
- [ ] Testar funcionalidade
- [ ] Verificar erros de compilação
- [ ] Executar testes automatizados
- [ ] Fazer code review
- [ ] Commit das mudanças

---

## 🎯 BENEFÍCIOS DA MIGRAÇÃO

### Performance:
- ✅ Bundle menor (tree-shaking)
- ✅ Imports mais rápidos
- ✅ Menos código carregado

### Manutenibilidade:
- ✅ Código mais claro
- ✅ Responsabilidades separadas
- ✅ Fácil de encontrar bugs

### Testabilidade:
- ✅ Testes isolados
- ✅ Mocks mais simples
- ✅ Cobertura melhor

---

## 📞 SUPORTE

### Dúvidas?

1. Consulte a documentação dos módulos
2. Veja exemplos em `REORGANIZACAO-COMPLETA-RESUMO.md`
3. Use o orquestrador temporariamente se necessário

### Problemas?

1. Verifique se o import está correto
2. Confirme que os tipos estão corretos
3. Use o orquestrador como fallback

---

## 🎉 CONCLUSÃO

A migração é **opcional** mas **recomendada**. O código antigo continua funcionando através do orquestrador, mas o novo código é mais limpo, testável e performático.

**Migre gradualmente, arquivo por arquivo, testando cada mudança.**

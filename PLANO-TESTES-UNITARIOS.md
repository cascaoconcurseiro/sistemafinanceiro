# 🧪 PLANO DE TESTES UNITÁRIOS

## 🎯 Objetivo

Criar testes unitários para os novos módulos criados na reorganização.

---

## 📋 MÓDULOS A TESTAR

### 1. TransactionCreator (Prioridade: ALTA)

**Arquivo**: `src/lib/services/transactions/__tests__/transaction-creator.test.ts`

**Testes a Criar**:
```typescript
describe('TransactionCreator', () => {
  describe('create', () => {
    it('deve criar transação simples', async () => {
      // Arrange
      const options = {
        transaction: {
          userId: 'user123',
          amount: 100,
          description: 'Teste',
          type: 'DESPESA',
          date: new Date(),
        },
      };

      // Act
      const result = await TransactionCreator.create(options);

      // Assert
      expect(result.transaction).toBeDefined();
      expect(result.transaction.amount).toBe(100);
    });

    it('deve criar lançamentos contábeis quando solicitado', async () => {
      // Test
    });

    it('deve vincular a fatura quando for cartão de crédito', async () => {
      // Test
    });

    it('deve atualizar saldo da conta', async () => {
      // Test
    });

    it('deve lançar erro se validação falhar', async () => {
      // Test
    });
  });
});
```

**Estimativa**: 2 horas

---

### 2. InstallmentCreator (Prioridade: ALTA)

**Arquivo**: `src/lib/services/transactions/__tests__/installment-creator.test.ts`

**Testes a Criar**:
```typescript
describe('InstallmentCreator', () => {
  describe('create', () => {
    it('deve criar parcelamento com todas as parcelas', async () => {
      // Test
    });

    it('deve calcular datas corretamente (mensal)', async () => {
      // Test
    });

    it('deve calcular datas corretamente (semanal)', async () => {
      // Test
    });

    it('deve marcar primeira parcela como paga', async () => {
      // Test
    });
  });

  describe('payInstallment', () => {
    it('deve pagar parcela específica', async () => {
      // Test
    });

    it('deve atualizar saldos após pagamento', async () => {
      // Test
    });
  });
});
```

**Estimativa**: 1.5 horas

---

### 3. TransferCreator (Prioridade: MÉDIA)

**Arquivo**: `src/lib/services/transactions/__tests__/transfer-creator.test.ts`

**Testes a Criar**:
```typescript
describe('TransferCreator', () => {
  describe('create', () => {
    it('deve criar transferência entre contas', async () => {
      // Test
    });

    it('deve criar débito e crédito', async () => {
      // Test
    });

    it('deve atualizar saldos de ambas as contas', async () => {
      // Test
    });

    it('deve lançar erro se contas forem iguais', async () => {
      // Test
    });
  });

  describe('cancel', () => {
    it('deve cancelar transferência', async () => {
      // Test
    });

    it('deve recalcular saldos após cancelamento', async () => {
      // Test
    });
  });
});
```

**Estimativa**: 1 hora

---

### 4. TransactionValidator (Prioridade: ALTA)

**Arquivo**: `src/lib/services/transactions/__tests__/transaction-validator.test.ts`

**Testes a Criar**:
```typescript
describe('TransactionValidator', () => {
  describe('validateCreditCardLimit', () => {
    it('deve passar se limite for suficiente', async () => {
      // Test
    });

    it('deve lançar erro se limite for insuficiente', async () => {
      // Test
    });

    it('deve lançar erro se cartão não existir', async () => {
      // Test
    });
  });

  describe('validateAccountBalance', () => {
    it('deve passar se saldo for suficiente', async () => {
      // Test
    });

    it('deve lançar erro se saldo for insuficiente', async () => {
      // Test
    });

    it('deve ignorar validação para contas de investimento', async () => {
      // Test
    });
  });

  describe('validateTransaction', () => {
    it('deve validar transação completa', async () => {
      // Test
    });
  });
});
```

**Estimativa**: 1.5 horas

---

### 5. BalanceCalculator (Prioridade: MÉDIA)

**Arquivo**: `src/lib/services/calculations/__tests__/balance-calculator.test.ts`

**Testes a Criar**:
```typescript
describe('BalanceCalculator', () => {
  describe('updateAccountBalance', () => {
    it('deve calcular saldo corretamente', async () => {
      // Test
    });

    it('deve considerar apenas transações não canceladas', async () => {
      // Test
    });

    it('deve somar receitas e subtrair despesas', async () => {
      // Test
    });
  });

  describe('updateCreditCardBalance', () => {
    it('deve calcular saldo usado do cartão', async () => {
      // Test
    });

    it('deve considerar apenas despesas', async () => {
      // Test
    });
  });

  describe('recalculateAllBalances', () => {
    it('deve recalcular todas as contas do usuário', async () => {
      // Test
    });

    it('deve recalcular todos os cartões do usuário', async () => {
      // Test
    });
  });
});
```

**Estimativa**: 1 hora

---

## 🛠️ SETUP DE TESTES

### 1. Instalar Dependências (se necessário)

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### 2. Configurar Jest

**Arquivo**: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/services/**/*.ts',
    '!src/lib/services/**/*.test.ts',
    '!src/lib/services/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 3. Criar Estrutura de Pastas

```bash
mkdir -p "Não apagar/SuaGrana-Clean/src/lib/services/transactions/__tests__"
mkdir -p "Não apagar/SuaGrana-Clean/src/lib/services/calculations/__tests__"
```

---

## 📊 ESTRATÉGIA DE TESTES

### Priorização:

1. **ALTA** (Fazer primeiro):
   - TransactionCreator
   - TransactionValidator
   - InstallmentCreator

2. **MÉDIA** (Fazer depois):
   - TransferCreator
   - BalanceCalculator

3. **BAIXA** (Opcional):
   - Testes de integração
   - Testes E2E

### Cobertura Alvo:

- **Mínimo**: 80% de cobertura
- **Ideal**: 90% de cobertura
- **Foco**: Lógica de negócio e validações

---

## 🎯 CRONOGRAMA

### Dia 1 (2h):
- [ ] Setup de testes
- [ ] Testes do TransactionCreator

### Dia 2 (2h):
- [ ] Testes do TransactionValidator
- [ ] Testes do InstallmentCreator

### Dia 3 (1.5h):
- [ ] Testes do TransferCreator
- [ ] Testes do BalanceCalculator

### Dia 4 (0.5h):
- [ ] Revisão e ajustes
- [ ] Verificar cobertura

**Total**: ~6 horas

---

## ✅ CRITÉRIOS DE SUCESSO

- [ ] Todos os módulos têm testes
- [ ] Cobertura mínima de 80%
- [ ] Todos os testes passando
- [ ] Testes são rápidos (<5s total)
- [ ] Testes são independentes
- [ ] Mocks estão bem configurados

---

## 📝 EXEMPLO DE TESTE COMPLETO

```typescript
import { TransactionCreator } from '../transaction-creator';
import { prisma } from '@/lib/prisma';

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    transaction: {
      create: jest.fn(),
    },
  },
}));

describe('TransactionCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar transação simples', async () => {
      // Arrange
      const mockTransaction = {
        id: 'trans123',
        userId: 'user123',
        amount: 100,
        description: 'Teste',
        type: 'DESPESA',
        date: new Date(),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
        });
      });

      const options = {
        transaction: {
          userId: 'user123',
          amount: 100,
          description: 'Teste',
          type: 'DESPESA',
          date: new Date(),
        },
      };

      // Act
      const result = await TransactionCreator.create(options);

      // Assert
      expect(result.transaction).toBeDefined();
      expect(result.transaction.id).toBe('trans123');
      expect(result.transaction.amount).toBe(100);
    });
  });
});
```

---

**Pronto para começar os testes!** 🧪

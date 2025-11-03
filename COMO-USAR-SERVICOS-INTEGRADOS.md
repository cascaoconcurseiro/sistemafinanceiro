# 🚀 COMO USAR OS SERVIÇOS INTEGRADOS

**Data**: 01/11/2025  
**Status**: ✅ PRONTO PARA USO

---

## 📦 O QUE FOI CRIADO

### 1. IntegratedFinancialService
Serviço backend que centraliza todos os 11 serviços implementados.

**Localização**: `src/lib/services/integrated-financial-service.ts`

### 2. useIntegratedFinancial Hook
Hook React que facilita o uso no frontend com contexto do usuário.

**Localização**: `src/hooks/use-integrated-financial.ts`

---

## 🎯 COMO USAR NO FRONTEND

### Passo 1: Importar o Hook

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
```

### Passo 2: Usar no Componente

```typescript
function MeuComponente() {
  const financial = useIntegratedFinancial();

  // Agora você tem acesso a TODOS os serviços!
}
```

---

## 📚 EXEMPLOS PRÁTICOS

### 1. Criar Transação (com tudo automático)

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';

function AddTransactionForm() {
  const financial = useIntegratedFinancial();

  const handleSubmit = async (data) => {
    try {
      const result = await financial.createTransaction({
        accountId: data.accountId,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        type: data.type,
        date: new Date(),
        status: 'cleared'
      });

      // Automático:
      // ✅ Idempotência (sem duplicatas)
      // ✅ Validações temporais
      // ✅ Eventos emitidos
      // ✅ Auditoria registrada
      // ✅ Lançamentos contábeis
      // ✅ Contexto atualizado

      console.log('✅ Transação criada:', result);
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Seus campos */}
    </form>
  );
}
```

### 2. Fazer Transferência Atômica

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';

function TransferForm() {
  const financial = useIntegratedFinancial();

  const handleTransfer = async () => {
    try {
      const result = await financial.createTransfer({
        fromAccountId: 'conta-1',
        toAccountId: 'conta-2',
        amount: 500,
        description: 'Transferência entre contas',
        date: new Date()
      });

      // Automático:
      // ✅ Atomicidade garantida
      // ✅ Ambas as contas atualizadas
      // ✅ Rollback se falhar
      // ✅ Rastreamento completo
      // ✅ Contexto atualizado

      console.log('✅ Transferência realizada:', result);
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  return (
    <button onClick={handleTransfer}>
      Fazer Transferência
    </button>
  );
}
```

### 3. Pagar Fatura (cria próxima automaticamente)

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';

function PayInvoiceButton({ invoiceId, accountId }) {
  const financial = useIntegratedFinancial();

  const handlePay = async () => {
    try {
      const result = await financial.payInvoice(invoiceId, accountId);

      // Automático:
      // ✅ Fatura paga
      // ✅ Próxima fatura criada
      // ✅ Ciclo contínuo
      // ✅ Transação registrada
      // ✅ Contexto atualizado

      console.log('✅ Fatura paga:', result);
      console.log('📅 Próxima fatura:', result.nextInvoice);
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  return (
    <button onClick={handlePay}>
      Pagar Fatura
    </button>
  );
}
```

### 4. Pagar Fatura Parcialmente (Rotativo)

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';

function PayInvoicePartialForm({ invoiceId, accountId, totalAmount }) {
  const financial = useIntegratedFinancial();
  const [amount, setAmount] = useState(0);

  const handlePayPartial = async () => {
    try {
      const result = await financial.payInvoicePartial(
        invoiceId,
        accountId,
        amount
      );

      // Automático:
      // ✅ Pagamento parcial registrado
      // ✅ Saldo restante calculado
      // ✅ Juros aplicados
      // ✅ Próxima fatura com saldo
      // ✅ Contexto atualizado

      console.log('✅ Pagamento parcial:', result);
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Valor a pagar"
      />
      <button onClick={handlePayPartial}>
        Pagar Parcial
      </button>
    </div>
  );
}
```

### 5. Ver Saldo Projetado

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
import { useState, useEffect } from 'react';

function ProjectedBalanceWidget({ accountId }) {
  const financial = useIntegratedFinancial();
  const [projected, setProjected] = useState(null);

  useEffect(() => {
    const loadProjection = async () => {
      // Projetar saldo para daqui a 30 dias
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);

      const result = await financial.getProjectedBalance(
        accountId,
        targetDate
      );

      setProjected(result);
    };

    loadProjection();
  }, [accountId]);

  if (!projected) return <div>Carregando...</div>;

  return (
    <div>
      <h3>Projeção de Saldo</h3>
      <p>Saldo Atual: R$ {projected.currentBalance.toFixed(2)}</p>
      <p>Saldo Projetado: R$ {projected.projectedBalance.toFixed(2)}</p>
      <p>Receitas Futuras: R$ {projected.futureIncome.toFixed(2)}</p>
      <p>Despesas Futuras: R$ {projected.futureExpenses.toFixed(2)}</p>
    </div>
  );
}
```

### 6. Ver Histórico de Saldo

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
import { useState, useEffect } from 'react';

function BalanceHistoryChart({ accountId }) {
  const financial = useIntegratedFinancial();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6); // Últimos 6 meses

      const result = await financial.getBalanceEvolution(
        accountId,
        startDate,
        endDate
      );

      setHistory(result.history);
    };

    loadHistory();
  }, [accountId]);

  return (
    <div>
      <h3>Evolução do Saldo</h3>
      {history.map((item) => (
        <div key={item.date}>
          {new Date(item.date).toLocaleDateString()}: R$ {item.balance.toFixed(2)}
        </div>
      ))}
    </div>
  );
}
```

### 7. Gerar DRE (Demonstração do Resultado do Exercício)

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
import { useState } from 'react';

function DREReport() {
  const financial = useIntegratedFinancial();
  const [dre, setDre] = useState(null);

  const generateReport = async () => {
    const startDate = new Date(2025, 0, 1); // Janeiro
    const endDate = new Date(2025, 11, 31); // Dezembro

    const result = await financial.generateDRE(startDate, endDate);
    setDre(result);
  };

  return (
    <div>
      <button onClick={generateReport}>Gerar DRE</button>
      
      {dre && (
        <div>
          <h3>DRE - {dre.period}</h3>
          <p>Receitas: R$ {dre.totalRevenue.toFixed(2)}</p>
          <p>Despesas: R$ {dre.totalExpenses.toFixed(2)}</p>
          <p>Resultado: R$ {dre.netResult.toFixed(2)}</p>
          
          <h4>Receitas por Categoria</h4>
          {dre.revenueByCategory.map((cat) => (
            <div key={cat.category}>
              {cat.category}: R$ {cat.amount.toFixed(2)}
            </div>
          ))}
          
          <h4>Despesas por Categoria</h4>
          {dre.expensesByCategory.map((cat) => (
            <div key={cat.category}>
              {cat.category}: R$ {cat.amount.toFixed(2)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8. Gerar Balanço Patrimonial

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
import { useState } from 'react';

function BalanceSheetReport() {
  const financial = useIntegratedFinancial();
  const [balance, setBalance] = useState(null);

  const generateReport = async () => {
    const result = await financial.generateBalanceSheet();
    setBalance(result);
  };

  return (
    <div>
      <button onClick={generateReport}>Gerar Balanço</button>
      
      {balance && (
        <div>
          <h3>Balanço Patrimonial</h3>
          
          <h4>Ativos</h4>
          <p>Total: R$ {balance.totalAssets.toFixed(2)}</p>
          <ul>
            {balance.assets.map((asset) => (
              <li key={asset.name}>
                {asset.name}: R$ {asset.value.toFixed(2)}
              </li>
            ))}
          </ul>
          
          <h4>Passivos</h4>
          <p>Total: R$ {balance.totalLiabilities.toFixed(2)}</p>
          <ul>
            {balance.liabilities.map((liability) => (
              <li key={liability.name}>
                {liability.name}: R$ {liability.value.toFixed(2)}
              </li>
            ))}
          </ul>
          
          <h4>Patrimônio Líquido</h4>
          <p>R$ {balance.equity.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

### 9. Conciliação Bancária

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
import { useState } from 'react';

function BankReconciliation({ accountId }) {
  const financial = useIntegratedFinancial();
  const [bankBalance, setBankBalance] = useState(0);
  const [reconciliation, setReconciliation] = useState(null);

  const startReconciliation = async () => {
    const result = await financial.startReconciliation(
      accountId,
      bankBalance
    );
    setReconciliation(result);
  };

  const completeReconciliation = async () => {
    await financial.completeReconciliation(
      reconciliation.id,
      'Conciliação realizada com sucesso'
    );
    alert('Conciliação concluída!');
  };

  return (
    <div>
      <h3>Conciliação Bancária</h3>
      
      <input
        type="number"
        value={bankBalance}
        onChange={(e) => setBankBalance(Number(e.target.value))}
        placeholder="Saldo do banco"
      />
      
      <button onClick={startReconciliation}>
        Iniciar Conciliação
      </button>
      
      {reconciliation && (
        <div>
          <p>Saldo Banco: R$ {reconciliation.bankBalance.toFixed(2)}</p>
          <p>Saldo Sistema: R$ {reconciliation.systemBalance.toFixed(2)}</p>
          <p>Diferença: R$ {reconciliation.difference.toFixed(2)}</p>
          
          {reconciliation.difference === 0 ? (
            <p>✅ Saldos conferem!</p>
          ) : (
            <p>⚠️ Há diferença nos saldos</p>
          )}
          
          <button onClick={completeReconciliation}>
            Concluir Conciliação
          </button>
        </div>
      )}
    </div>
  );
}
```

### 10. Verificar Duplicatas

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';

function AddTransactionWithDuplicateCheck() {
  const financial = useIntegratedFinancial();

  const handleSubmit = async (data) => {
    // Verificar duplicata antes de criar
    const isDuplicate = await financial.checkDuplicate(
      data.amount,
      data.description,
      data.date
    );

    if (isDuplicate) {
      const confirm = window.confirm(
        'Já existe uma transação similar. Deseja criar mesmo assim?'
      );
      if (!confirm) return;
    }

    // Criar transação
    await financial.createTransaction(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Seus campos */}
    </form>
  );
}
```

---

## 🎯 TODOS OS MÉTODOS DISPONÍVEIS

### Transações
- `createTransaction(data)` - Criar com idempotência e validações
- `updateTransaction(id, data)` - Atualizar com validações
- `deleteTransaction(id)` - Deletar com auditoria

### Transferências
- `createTransfer(data)` - Transferência atômica
- `cancelTransfer(id)` - Cancelar transferência

### Faturas
- `payInvoice(invoiceId, accountId)` - Pagar fatura completa
- `payInvoicePartial(invoiceId, accountId, amount)` - Pagar parcial (rotativo)

### Fluxo de Caixa
- `getProjectedBalance(accountId, targetDate)` - Saldo projetado
- `getMonthlyCashFlow(accountId, month, year)` - Fluxo mensal

### Histórico
- `getBalanceAtDate(accountId, date)` - Saldo em data específica
- `getBalanceEvolution(accountId, startDate, endDate)` - Evolução temporal

### Conciliação
- `startReconciliation(accountId, bankBalance)` - Iniciar conciliação
- `completeReconciliation(reconciliationId, notes)` - Concluir conciliação

### Relatórios
- `generateDRE(startDate, endDate)` - DRE profissional
- `generateBalanceSheet()` - Balanço patrimonial
- `analyzeCategories(startDate, endDate)` - Análise de categorias
- `analyzeTrends(months)` - Análise de tendências

### Utilitários
- `processEvents()` - Processar eventos pendentes
- `checkDuplicate(amount, description, date)` - Verificar duplicata

---

## ✅ BENEFÍCIOS

### Automático
- ✅ Idempotência (sem duplicatas)
- ✅ Validações temporais
- ✅ Eventos emitidos
- ✅ Auditoria registrada
- ✅ Lançamentos contábeis
- ✅ Contexto atualizado

### Seguro
- ✅ Atomicidade garantida
- ✅ Rollback automático
- ✅ Validações completas
- ✅ Rastreamento total

### Profissional
- ✅ Relatórios avançados
- ✅ Projeções precisas
- ✅ Histórico completo
- ✅ Conciliação bancária

---

## 🚀 COMEÇAR A USAR

### 1. Importe o hook

```typescript
import { useIntegratedFinancial } from '@/hooks/use-integrated-financial';
```

### 2. Use no componente

```typescript
const financial = useIntegratedFinancial();
```

### 3. Aproveite todos os recursos!

```typescript
await financial.createTransaction(data);
await financial.createTransfer(data);
await financial.payInvoice(invoiceId, accountId);
await financial.generateDRE(startDate, endDate);
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **IntegratedFinancialService**: `src/lib/services/integrated-financial-service.ts`
- **useIntegratedFinancial Hook**: `src/hooks/use-integrated-financial.ts`
- **Exemplos**: Este documento

---

## 🎉 PRONTO PARA USO!

Todos os 11 serviços implementados estão disponíveis através de um único hook fácil de usar!

**Comece agora e aproveite todas as funcionalidades profissionais!** 🚀


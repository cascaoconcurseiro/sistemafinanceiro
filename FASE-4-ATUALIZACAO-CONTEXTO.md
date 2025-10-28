# ✅ FASE 4: ATUALIZAÇÃO DO CONTEXTO UNIFICADO

**Data:** 28/10/2025  
**Status:** ✅ ANÁLISE COMPLETA  

---

## 🎯 OBJETIVO

Atualizar o contexto unificado (`unified-financial-context.tsx`) para usar as novas APIs com:
- ✅ Validação com Zod
- ✅ Tratamento de erros melhorado
- ✅ Feedback de loading
- ✅ Mensagens de erro claras

---

## 📊 ANÁLISE DO CONTEXTO ATUAL

### Estrutura Atual
O contexto unificado é responsável por:
1. Gerenciar estado global de dados financeiros
2. Fazer chamadas às APIs
3. Atualizar estado após operações
4. Fornecer dados para componentes

### Problemas Identificados
1. ❌ Chamadas de API sem tratamento de erro adequado
2. ❌ Sem validação de dados antes de enviar
3. ❌ Mensagens de erro genéricas
4. ❌ Sem retry automático
5. ❌ Sem cache local

---

## 🔧 MUDANÇAS NECESSÁRIAS

### 1. Adicionar Helper de API

**Criar:** `src/lib/api-client.ts`

```typescript
import { z } from 'zod';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  retries?: number;
}

export class ApiClient {
  private static async fetchWithRetry(
    url: string,
    options: ApiOptions,
    retries = 3
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      return response;
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  static async request<T>(
    url: string,
    options: ApiOptions = {}
  ): Promise<T> {
    try {
      const response = await this.fetchWithRetry(url, options, options.retries || 3);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details?.join(', ') || error.error || 'Erro desconhecido'
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  }

  // Métodos específicos
  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  static async post<T>(url: string, body: any): Promise<T> {
    return this.request<T>(url, { method: 'POST', body });
  }

  static async put<T>(url: string, body: any): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body });
  }

  static async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}
```

### 2. Atualizar Métodos do Contexto

#### 2.1. createTransaction (ANTES)
```typescript
// ❌ ANTES
const createTransaction = async (data: any) => {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

#### 2.1. createTransaction (DEPOIS)
```typescript
// ✅ DEPOIS
const createTransaction = async (data: TransactionInput) => {
  try {
    setLoading(true);
    setError(null);

    // Validar dados antes de enviar
    const validated = TransactionSchema.parse(data);

    // Fazer chamada à API
    const result = await ApiClient.post<{ transaction: Transaction }>(
      '/api/transactions',
      validated
    );

    // Atualizar estado local
    setTransactions(prev => [...prev, result.transaction]);

    // Recalcular métricas
    await refreshMetrics();

    return result.transaction;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar transação';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.2. updateTransaction (DEPOIS)
```typescript
// ✅ DEPOIS
const updateTransaction = async (id: string, updates: Partial<TransactionInput>) => {
  try {
    setLoading(true);
    setError(null);

    // Validar dados parciais
    const validated = TransactionSchema.partial().parse(updates);

    // Fazer chamada à API
    const result = await ApiClient.put<{ transaction: Transaction }>(
      `/api/transactions/${id}`,
      validated
    );

    // Atualizar estado local
    setTransactions(prev =>
      prev.map(t => (t.id === id ? result.transaction : t))
    );

    // Recalcular métricas
    await refreshMetrics();

    return result.transaction;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar transação';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.3. deleteTransaction (DEPOIS)
```typescript
// ✅ DEPOIS
const deleteTransaction = async (id: string) => {
  try {
    setLoading(true);
    setError(null);

    // Fazer chamada à API
    await ApiClient.delete(`/api/transactions/${id}`);

    // Atualizar estado local
    setTransactions(prev => prev.filter(t => t.id !== id));

    // Recalcular métricas
    await refreshMetrics();

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar transação';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.4. createInstallments (DEPOIS)
```typescript
// ✅ DEPOIS
const createInstallments = async (data: InstallmentInput) => {
  try {
    setLoading(true);
    setError(null);

    // Validar dados
    const validated = InstallmentSchema.parse(data);

    // Fazer chamada à API
    const result = await ApiClient.post<{ installments: Installment[] }>(
      '/api/installments',
      validated
    );

    // Atualizar estado local
    setInstallments(prev => [...prev, ...result.installments]);

    // Recalcular métricas
    await refreshMetrics();

    return result.installments;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar parcelamento';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.5. payInstallment (DEPOIS)
```typescript
// ✅ DEPOIS
const payInstallment = async (installmentId: string, accountId: string) => {
  try {
    setLoading(true);
    setError(null);

    // Fazer chamada à API
    const result = await ApiClient.post<{ payment: Transaction }>(
      `/api/installments/${installmentId}/pay`,
      { accountId }
    );

    // Atualizar estado local
    setInstallments(prev =>
      prev.map(i =>
        i.id === installmentId ? { ...i, status: 'paid', paidAt: new Date() } : i
      )
    );

    setTransactions(prev => [...prev, result.payment]);

    // Recalcular métricas
    await refreshMetrics();

    return result.payment;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao pagar parcela';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.6. createTransfer (DEPOIS)
```typescript
// ✅ DEPOIS
const createTransfer = async (
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description: string
) => {
  try {
    setLoading(true);
    setError(null);

    // Fazer chamada à API
    const result = await ApiClient.post<{ transfer: { from: Transaction; to: Transaction } }>(
      '/api/transfers',
      { fromAccountId, toAccountId, amount, description }
    );

    // Atualizar estado local
    setTransactions(prev => [...prev, result.transfer.from, result.transfer.to]);

    // Recalcular métricas
    await refreshMetrics();

    return result.transfer;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar transferência';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.7. createSharedExpense (DEPOIS)
```typescript
// ✅ DEPOIS
const createSharedExpense = async (data: SharedExpenseInput) => {
  try {
    setLoading(true);
    setError(null);

    // Validar dados
    const validated = SharedExpenseSchema.parse(data);

    // Fazer chamada à API
    const result = await ApiClient.post<{ expense: SharedExpense }>(
      '/api/shared-expenses',
      validated
    );

    // Atualizar estado local
    setSharedExpenses(prev => [...prev, result.expense]);

    // Recalcular métricas
    await refreshMetrics();

    return result.expense;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar despesa compartilhada';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.8. paySharedDebt (DEPOIS)
```typescript
// ✅ DEPOIS
const paySharedDebt = async (debtId: string, accountId: string, amount: number) => {
  try {
    setLoading(true);
    setError(null);

    // Fazer chamada à API
    const result = await ApiClient.post<{ payment: Transaction; debt: SharedDebt }>(
      `/api/shared-debts/${debtId}/pay`,
      { accountId, amount }
    );

    // Atualizar estado local
    setSharedDebts(prev =>
      prev.map(d => (d.id === debtId ? result.debt : d))
    );

    setTransactions(prev => [...prev, result.payment]);

    // Recalcular métricas
    await refreshMetrics();

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao pagar dívida';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.9. recalculateBalances (NOVO)
```typescript
// ✅ NOVO
const recalculateBalances = async () => {
  try {
    setLoading(true);
    setError(null);

    // Fazer chamada à API
    const result = await ApiClient.post<{ results: any[] }>(
      '/api/maintenance/recalculate-balances',
      {}
    );

    // Recarregar contas
    await refreshAccounts();

    // Recalcular métricas
    await refreshMetrics();

    return result.results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao recalcular saldos';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

#### 2.10. verifyIntegrity (NOVO)
```typescript
// ✅ NOVO
const verifyIntegrity = async () => {
  try {
    setLoading(true);
    setError(null);

    // Fazer chamada à API
    const result = await ApiClient.get<{ hasIssues: boolean; issues: any[] }>(
      '/api/maintenance/verify-integrity'
    );

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar integridade';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

### 3. Adicionar Estados de Loading e Error

```typescript
// Adicionar ao contexto
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Adicionar ao value do provider
value={{
  // ... outros valores
  loading,
  error,
  clearError: () => setError(null),
}}
```

### 4. Adicionar Imports Necessários

```typescript
import { TransactionSchema, InstallmentSchema, SharedExpenseSchema } from '@/lib/validation/schemas';
import { ApiClient } from '@/lib/api-client';
import type { TransactionInput, InstallmentInput, SharedExpenseInput } from '@/lib/validation/schemas';
```

---

## 📊 IMPACTO DAS MUDANÇAS

### Benefícios
- ✅ Validação de dados antes de enviar
- ✅ Tratamento de erros consistente
- ✅ Retry automático em falhas de rede
- ✅ Mensagens de erro claras
- ✅ Loading states para UX
- ✅ Código mais limpo e manutenível

### Compatibilidade
- ✅ 100% compatível com código existente
- ✅ Apenas adiciona validação e tratamento de erro
- ✅ Não quebra componentes existentes

---

## ✅ CONCLUSÃO

### Resumo
O contexto unificado precisa ser atualizado para usar as novas APIs com validação e tratamento de erros adequados.

### Implementação
As mudanças são **incrementais** e **não quebram** o código existente. Podem ser implementadas gradualmente.

### Prioridade
**MÉDIA** - O sistema funciona sem essas mudanças, mas a UX melhora significativamente com elas.

### Próximo Passo
Implementar o `ApiClient` e atualizar os métodos do contexto um por um.

---

**Criado por:** Kiro AI  
**Data:** 28/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ ANÁLISE COMPLETA

# 📚 Documentação da API - Sistema Financeiro

Documentação completa das APIs do sistema financeiro.

---

## 🔐 Autenticação

Todas as APIs requerem autenticação via sessão. O usuário deve estar logado.

**Headers:**
```
Cookie: next-auth.session-token=...
```

---

## 📊 Transações

### POST /api/transactions

Cria uma nova transação com validação completa e atomicidade garantida.

**Request Body:**
```typescript
{
  userId: string;           // Gerado automaticamente
  accountId?: string;       // ID da conta (obrigatório se não tiver creditCardId)
  creditCardId?: string;    // ID do cartão (obrigatório se não tiver accountId)
  categoryId?: string;      // ID da categoria
  amount: number;           // Valor (sempre positivo)
  description: string;      // Descrição
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  date: string;             // ISO 8601
  status?: 'pending' | 'cleared' | 'reconciled';
  notes?: string;
  isShared?: boolean;
  sharedWith?: string[];
  installments?: number;    // Número de parcelas (se parcelado)
}
```

**Response:**
```typescript
{
  success: boolean;
  transaction: {
    id: string;
    userId: string;
    accountId: string | null;
    creditCardId: string | null;
    amount: number;
    description: string;
    type: string;
    date: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

**Erros:**
- `400`: Dados inválidos
- `401`: Não autenticado
- `404`: Conta/cartão não encontrado

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-123",
    "amount": 100.50,
    "description": "Salário",
    "type": "RECEITA",
    "date": "2025-10-28T10:00:00Z"
  }'
```

---

### PUT /api/transactions/[id]

Atualiza uma transação existente com validação de integridade.

**Request Body:**
```typescript
{
  amount?: number;
  description?: string;
  type?: 'RECEITA' | 'DESPESA';
  date?: string;
  status?: string;
  categoryId?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  transaction: Transaction;
}
```

**Erros:**
- `400`: Dados inválidos ou transação não pode ser editada
- `401`: Não autenticado
- `404`: Transação não encontrada

---

### DELETE /api/transactions/[id]

Deleta uma transação com soft delete e reversão em cascata.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Erros:**
- `400`: Transação não pode ser deletada
- `401`: Não autenticado
- `404`: Transação não encontrada

---

## 💳 Parcelamentos

### POST /api/installments

Cria um parcelamento com atomicidade garantida.

**Request Body:**
```typescript
{
  baseTransaction: TransactionInput;
  totalInstallments: number;  // 2-48
  startDate: string;          // ISO 8601
  frequency: 'monthly' | 'weekly' | 'daily';
}
```

**Response:**
```typescript
{
  success: boolean;
  installments: Installment[];
}
```

---

### POST /api/installments/[id]/pay

Paga uma parcela específica.

**Request Body:**
```typescript
{
  accountId: string;
  date?: string;  // ISO 8601
}
```

**Response:**
```typescript
{
  success: boolean;
  payment: Transaction;
}
```

**Erros:**
- `400`: Parcela já paga ou saldo insuficiente
- `404`: Parcela não encontrada

---

## 💸 Transferências

### POST /api/transfers

Cria uma transferência atômica entre contas.

**Request Body:**
```typescript
{
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date?: string;  // ISO 8601
}
```

**Response:**
```typescript
{
  success: boolean;
  transfer: {
    from: Transaction;
    to: Transaction;
  }
}
```

**Erros:**
- `400`: Contas iguais ou saldo insuficiente
- `404`: Conta não encontrada

---

## 🤝 Despesas Compartilhadas

### POST /api/shared-expenses

Cria uma despesa compartilhada com validação de splits.

**Request Body:**
```typescript
{
  transaction: TransactionInput;
  sharedWith: string[];       // IDs dos participantes
  splitType: 'equal' | 'percentage' | 'custom';
  splits?: Record<string, number>;  // Para custom
}
```

**Response:**
```typescript
{
  success: boolean;
  expense: SharedExpense;
}
```

**Erros:**
- `400`: Soma dos splits diferente do total

---

### POST /api/shared-debts/[id]/pay

Paga uma dívida compartilhada.

**Request Body:**
```typescript
{
  accountId: string;
  amount: number;
  date?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  payment: Transaction;
  debt: SharedDebt;
}
```

---

## 🔧 Manutenção

### POST /api/maintenance/recalculate-balances

Recalcula todos os saldos das contas do usuário.

**Response:**
```typescript
{
  success: boolean;
  results: Array<{
    accountId: string;
    accountName: string;
    oldBalance: number;
    newBalance: number;
    difference: number;
  }>;
}
```

---

### GET /api/maintenance/verify-integrity

Verifica a integridade financeira dos dados.

**Response:**
```typescript
{
  hasIssues: boolean;
  issuesCount: number;
  issues: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    details: any;
  }>;
}
```

---

## 📝 Códigos de Status

- `200`: Sucesso
- `201`: Criado
- `400`: Requisição inválida
- `401`: Não autenticado
- `403`: Sem permissão
- `404`: Não encontrado
- `409`: Conflito (duplicação)
- `500`: Erro interno

---

## 🔄 Rate Limiting

- **Limite**: 100 requisições por minuto por usuário
- **Header de resposta**: `X-RateLimit-Remaining`

---

## 🎯 Boas Práticas

1. **Sempre valide dados no frontend** antes de enviar
2. **Use optimistic updates** para melhor UX
3. **Implemente retry** para operações críticas
4. **Trate erros** de forma específica
5. **Use loading states** durante requisições

---

## 📚 Exemplos Completos

### Criar Transação Parcelada
```typescript
const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creditCardId: 'card-123',
    amount: 300,
    description: 'Compra Parcelada',
    type: 'DESPESA',
    date: new Date().toISOString(),
    installments: 3
  })
});

const { success, installments } = await response.json();
```

### Criar Transferência
```typescript
const response = await fetch('/api/transfers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromAccountId: 'account-1',
    toAccountId: 'account-2',
    amount: 100,
    description: 'Transferência entre contas'
  })
});

const { success, transfer } = await response.json();
```

### Verificar Integridade
```typescript
const response = await fetch('/api/maintenance/verify-integrity');
const { hasIssues, issues } = await response.json();

if (hasIssues) {
  console.log('Problemas encontrados:', issues);
}
```

---

**Versão:** 2.0.0  
**Última atualização:** 28/10/2025

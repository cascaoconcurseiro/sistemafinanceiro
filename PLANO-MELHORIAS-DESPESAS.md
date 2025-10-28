# 🚀 Plano de Implementação: Melhorias Críticas

## 1️⃣ Simplificação de Dívidas (PRIORIDADE 1)

### Objetivo
Compensar automaticamente dívidas entre as mesmas pessoas.

### Exemplo
**Antes:**
- Wesley me deve: R$ 50,00
- Eu devo para Wesley: R$ 5,00
- **Total mostrado:** R$ 50,00 a receber + R$ 5,00 a pagar

**Depois:**
- **Total simplificado:** R$ 45,00 a receber de Wesley

### Implementação

#### A. Criar função de simplificação
```typescript
// src/lib/utils/debt-simplification.ts
function simplifyDebts(debts: Debt[], userId: string): SimplifiedDebt[] {
  // Agrupa dívidas por pessoa
  // Calcula saldo líquido
  // Retorna apenas dívidas líquidas
}
```

#### B. Aplicar na exibição
- Modificar `shared-expenses-billing.tsx`
- Calcular saldo líquido antes de exibir
- Mostrar apenas valor final

#### C. Manter dados originais
- Não alterar banco de dados
- Simplificação apenas na visualização
- Histórico completo preservado

---

## 2️⃣ Consolidação de Dados (PRIORIDADE 2)

### Objetivo
Ter uma única fonte de verdade para despesas compartilhadas.

### Problema Atual
```
Transaction.isShared = true
Transaction.sharedWith = ["user1"]
SharedDebt.id = "debt1"
SharedExpense.id = "expense1"
```
→ Dados duplicados, pode ficar inconsistente

### Solução
```
SharedExpense (fonte de verdade)
  ├─> Transaction (movimentação financeira)
  └─> SharedDebt (saldo consolidado)
```

### Implementação

#### A. Refatorar modelo de dados
```prisma
model SharedExpense {
  id: String
  description: String
  totalAmount: Decimal
  paidBy: String
  date: DateTime
  
  // Relacionamentos
  transactionId: String
  transaction: Transaction
  
  // Participantes
  participants: SharedParticipant[]
  
  // Status consolidado
  status: String // pending | paid | settled
}

model SharedParticipant {
  id: String
  expenseId: String
  userId: String
  share: Decimal
  paid: Decimal
  status: String
}
```

#### B. Migração de dados
- Script para migrar dados existentes
- Manter compatibilidade durante transição

---

## 3️⃣ Sistema de Notificações (PRIORIDADE 3)

### Objetivo
Notificar usuários sobre ações em despesas compartilhadas.

### Tipos de Notificações

1. **Nova Despesa Compartilhada**
   - "Wesley adicionou uma despesa de R$ 50,00"
   
2. **Pagamento Recebido**
   - "Wesley pagou R$ 45,00 da fatura"
   
3. **Lembrete de Dívida**
   - "Você tem R$ 45,00 pendentes com Wesley"

### Implementação

#### A. Modelo de Notificação
```prisma
model Notification {
  id: String
  userId: String
  type: String // expense_added | payment_received | debt_reminder
  title: String
  message: String
  data: String // JSON com dados extras
  read: Boolean
  createdAt: DateTime
}
```

#### B. Sistema de Envio
```typescript
// src/lib/notifications/notification-service.ts
async function sendNotification(
  userId: string,
  type: string,
  data: any
): Promise<void> {
  // Criar notificação no banco
  // Enviar push notification (futuro)
  // Enviar email (futuro)
}
```

#### C. UI de Notificações
- Badge no menu com contador
- Lista de notificações
- Marcar como lida

---

## 📅 Cronograma de Implementação

### Semana 1: Simplificação de Dívidas
- [ ] Dia 1-2: Criar função de simplificação
- [ ] Dia 3-4: Integrar na UI
- [ ] Dia 5: Testes e ajustes

### Semana 2: Consolidação de Dados
- [ ] Dia 1-2: Refatorar modelos
- [ ] Dia 3-4: Migração de dados
- [ ] Dia 5: Testes e validação

### Semana 3: Sistema de Notificações
- [ ] Dia 1-2: Criar modelo e serviço
- [ ] Dia 3-4: Integrar na UI
- [ ] Dia 5: Testes e ajustes

---

## 🎯 Ordem de Implementação

**AGORA:** Simplificação de Dívidas (mais impacto, menos risco)
**DEPOIS:** Sistema de Notificações (independente, pode ser paralelo)
**POR ÚLTIMO:** Consolidação de Dados (mais complexo, requer migração)

---

## ✅ Próximos Passos

1. Implementar simplificação de dívidas
2. Testar com dados reais
3. Validar com usuário
4. Partir para próxima melhoria

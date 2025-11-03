# Exemplo Prático: Despesa Compartilhada

## 📖 Cenário Completo

**Participantes:**
- João (você)
- Maria (sua esposa)

**Situação:** Jantar no restaurante de R$ 100, dividido igualmente (50/50)

---

## 🎬 PASSO A PASSO

### 1️⃣ João Paga a Conta do Restaurante (R$ 100)

**Ação:** João cria uma transação compartilhada

**Formulário:**
```
Descrição: Jantar no Restaurante
Valor: R$ 100,00
Tipo: Despesa
Categoria: Alimentação
Conta: Conta Corrente João
Data: 30/10/2025
Compartilhado: ✅ Sim
Com quem: Maria
Divisão: Igual (50/50)
```

**O que acontece no sistema:**

#### A) Transação criada:
```json
{
  "id": "trans-001",
  "userId": "joao-id",
  "description": "Jantar no Restaurante",
  "amount": -100.00,
  "type": "DESPESA",
  "category": "Alimentação",
  "accountId": "conta-joao",
  "status": "cleared",
  "isShared": true,
  "sharedWith": ["maria-id"],
  "date": "2025-10-30"
}
```

#### B) Lançamentos Contábeis (Partidas Dobradas):
```
Débito:  Despesa (Alimentação) ........... R$ 100,00
Crédito: Conta Corrente (João) ........... R$ 100,00
```

#### C) Dívida Criada:
```json
{
  "id": "debt-001",
  "transactionId": "trans-001",
  "creditorId": "joao-id",
  "creditorName": "João",
  "debtorId": "maria-id",
  "debtorName": "Maria",
  "originalAmount": 50.00,
  "currentAmount": 50.00,
  "status": "active",
  "createdAt": "2025-10-30T20:00:00Z"
}
```

#### D) Saldo da Conta de João:
```
Saldo Anterior: R$ 1.000,00
Despesa:        -R$ 100,00
Saldo Atual:    R$ 900,00
```

**Visão de João:**
- ✅ Gastou R$ 100 (saiu da conta)
- ⏳ Maria deve R$ 50 (pendente)
- 💰 Saldo líquido esperado: -R$ 50 (sua parte)

**Visão de Maria:**
- ⚠️ Deve R$ 50 para João
- 📋 Aparece em "Dívidas Pendentes"

---

### 2️⃣ Maria Paga a Dívida (R$ 50)

**Ação:** Maria acessa "Dívidas Pendentes" e clica em "Pagar"

**Modal de Pagamento:**
```
Você deve a: João
Valor: R$ 50,00
Conta para débito: Conta Corrente Maria
Data: 30/10/2025
```

**O que acontece no sistema:**

#### A) Transação 1 - RECEITA (João recebe):
```json
{
  "id": "trans-002",
  "userId": "joao-id",
  "description": "Recebimento - Jantar no Restaurante",
  "amount": 50.00,
  "type": "RECEITA",
  "category": "Reembolso",
  "accountId": "conta-joao",
  "status": "cleared",
  "relatedDebtId": "debt-001",
  "date": "2025-10-30"
}
```

**Lançamentos Contábeis:**
```
Débito:  Conta Corrente (João) ........... R$ 50,00
Crédito: Receita (Reembolso) ............. R$ 50,00
```

**Saldo da Conta de João:**
```
Saldo Anterior: R$ 900,00
Receita:        +R$ 50,00
Saldo Atual:    R$ 950,00
```

#### B) Transação 2 - DESPESA (Maria paga):
```json
{
  "id": "trans-003",
  "userId": "maria-id",
  "description": "Pagamento - Jantar no Restaurante",
  "amount": -50.00,
  "type": "DESPESA",
  "category": "Alimentação",
  "accountId": "conta-maria",
  "status": "cleared",
  "relatedDebtId": "debt-001",
  "date": "2025-10-30"
}
```

**Lançamentos Contábeis:**
```
Débito:  Despesa (Alimentação) ........... R$ 50,00
Crédito: Conta Corrente (Maria) .......... R$ 50,00
```

**Saldo da Conta de Maria:**
```
Saldo Anterior: R$ 800,00
Despesa:        -R$ 50,00
Saldo Atual:    R$ 750,00
```

#### C) Dívida Atualizada:
```json
{
  "id": "debt-001",
  "status": "paid",
  "paidAt": "2025-10-30T21:00:00Z",
  "currentAmount": 0.00
}
```

---

## 📊 RESULTADO FINAL

### Extrato de João:
```
Data       Descrição                          Categoria      Valor      Saldo
30/10/2025 Jantar no Restaurante             Alimentação    -R$ 100,00  R$ 900,00
30/10/2025 Recebimento - Jantar no Rest...   Reembolso      +R$ 50,00   R$ 950,00
```

**Resumo João:**
- Gastou: R$ 100,00
- Recebeu: R$ 50,00
- **Custo líquido: R$ 50,00** ✅

### Extrato de Maria:
```
Data       Descrição                          Categoria      Valor      Saldo
30/10/2025 Pagamento - Jantar no Rest...     Alimentação    -R$ 50,00   R$ 750,00
```

**Resumo Maria:**
- Gastou: R$ 50,00
- **Custo líquido: R$ 50,00** ✅

---

## 🔄 CENÁRIO 2: Compensação de Dívidas

**Situação:**
- João deve R$ 50 para Maria (Jantar)
- Maria deve R$ 30 para João (Cinema)

**Cálculo:**
```
Dívida de João para Maria: R$ 50
Dívida de Maria para João: R$ 30
─────────────────────────────────
Líquido: João paga R$ 20 para Maria
```

**Transações criadas:**

#### João (paga R$ 20):
```json
{
  "description": "Pagamento líquido - Compensação",
  "amount": -20.00,
  "type": "DESPESA",
  "notes": "Compensado R$ 30 de créditos"
}
```

#### Maria (recebe R$ 20):
```json
{
  "description": "Recebimento líquido - Compensação",
  "amount": 20.00,
  "type": "RECEITA",
  "notes": "Compensado R$ 30 de dívidas"
}
```

**Dívidas atualizadas:**
```
debt-001 (João → Maria): status = "paid"
debt-002 (Maria → João): status = "paid"
```

---

## 📈 RELATÓRIOS

### Relatório de Despesas por Categoria (João):
```
Alimentação:
- Jantar no Restaurante: R$ 100,00
- (Reembolso recebido): -R$ 50,00
- Total líquido: R$ 50,00
```

### Relatório de Despesas por Categoria (Maria):
```
Alimentação:
- Pagamento - Jantar no Restaurante: R$ 50,00
- Total: R$ 50,00
```

### Relatório de Despesas Compartilhadas:
```
Jantar no Restaurante - R$ 100,00
├─ João (pagou): R$ 50,00
└─ Maria (pagou): R$ 50,00
Status: ✅ Quitado
```

---

## ✅ VALIDAÇÕES DO SISTEMA

1. **Ao criar despesa compartilhada:**
   - ✅ Conta do pagador existe e está ativa
   - ✅ Valor é positivo
   - ✅ Participantes existem no sistema
   - ✅ Divisão soma 100%

2. **Ao pagar dívida:**
   - ✅ Dívida existe e está ativa
   - ✅ Conta do devedor existe e está ativa
   - ✅ Valor corresponde ao valor da dívida
   - ✅ Ambas as transações são criadas atomicamente

3. **Integridade:**
   - ✅ Se uma transação falhar, nenhuma é criada
   - ✅ Saldos são atualizados corretamente
   - ✅ Logs de auditoria são registrados
   - ✅ Notificações são enviadas

---

## 🎯 BENEFÍCIOS DESTA ABORDAGEM

1. **Transparência Total:**
   - Cada pessoa vê exatamente o que gastou
   - Histórico completo de pagamentos
   - Rastreabilidade de todas as operações

2. **Contabilidade Correta:**
   - Partidas dobradas mantêm integridade
   - Saldos sempre corretos
   - Relatórios precisos

3. **Flexibilidade:**
   - Suporta compensação de dívidas
   - Permite divisão personalizada
   - Funciona com múltiplos participantes

4. **Auditoria:**
   - Todas as operações são rastreáveis
   - Histórico completo de mudanças
   - Logs de quem fez o quê e quando

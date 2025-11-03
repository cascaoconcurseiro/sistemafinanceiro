# ⚡ Guia Rápido - Novas Funcionalidades

## 🎯 Como Ativar Tudo em 5 Minutos

### Passo 1: Popular Partidas Dobradas (1 min)

```bash
# Fazer backup
cp prisma/dev.db prisma/dev.db.backup

# Popular lançamentos contábeis
node scripts/populate-journal-entries.js
```

**Resultado esperado**:
```
✅ Script concluído com sucesso!
📊 Total processado: 150
✅ Sucesso: 150
❌ Erros: 0
✅ Sistema balanceado!
```

---

### Passo 2: Adicionar Projeção ao Dashboard (2 min)

Edite `src/components/layout/dashboard-content.tsx`:

```typescript
// Adicionar import
import { CashFlowProjection } from '@/components/features/cash-flow/cash-flow-projection';

// Adicionar no JSX (após os cards de resumo)
<div className="mt-6">
  <CashFlowProjection userId={session.user.id} />
</div>
```

---

### Passo 3: Adicionar Botão de Reembolso (2 min)

Edite o componente de lista de transações:

```typescript
// Adicionar import
import { RefundModal } from '@/components/modals/refund-modal';
import { useState } from 'react';

// Adicionar states
const [showRefundModal, setShowRefundModal] = useState(false);
const [selectedTransaction, setSelectedTransaction] = useState(null);

// Adicionar botão no menu de ações
{transaction.type === 'DESPESA' && !transaction.deletedAt && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => {
      setSelectedTransaction(transaction);
      setShowRefundModal(true);
    }}
  >
    💰 Reembolsar
  </Button>
)}

// Adicionar modal no final do componente
{selectedTransaction && (
  <RefundModal
    open={showRefundModal}
    onOpenChange={setShowRefundModal}
    transactionId={selectedTransaction.id}
    transactionDescription={selectedTransaction.description}
    transactionAmount={selectedTransaction.amount}
    onSuccess={() => {
      setShowRefundModal(false);
      // Recarregar transações
    }}
  />
)}
```

---

## 🧪 Como Testar

### Teste 1: Projeção de Caixa

1. Acesse o dashboard
2. Veja o card "Projeção de Fluxo de Caixa"
3. Alterne entre períodos (7, 30, 90, 365 dias)
4. Verifique se mostra:
   - ✅ Parcelas futuras
   - ✅ Faturas de cartão
   - ✅ Transações agendadas
   - ✅ Recorrências

### Teste 2: Reembolso

1. Crie uma despesa de R$ 100
2. Clique em "Reembolsar"
3. Selecione uma conta
4. Digite R$ 50 (reembolso parcial)
5. Confirme
6. Verifique:
   - ✅ Receita de R$ 50 criada
   - ✅ Transação original mostra "Parcialmente reembolsada"
   - ✅ Saldo da conta aumentou R$ 50

### Teste 3: Partidas Dobradas

```bash
# Validar integridade
curl http://localhost:3000/api/journal/validate

# Verificar se retorna:
{
  "isHealthy": true,
  "coverage": "100.00%",
  "balanceValidation": {
    "isBalanced": true
  }
}
```

---

## 📊 Endpoints Disponíveis

### Projeção de Caixa

```bash
# 30 dias
GET /api/cash-flow/projection?period=month

# 90 dias
GET /api/cash-flow/projection?period=quarter

# 1 ano
GET /api/cash-flow/projection?period=year
```

### Reembolsos

```bash
# Criar reembolso
POST /api/refunds
{
  "originalTransactionId": "tx-123",
  "amount": 50.00,
  "accountId": "acc-456",
  "date": "2025-10-30",
  "description": "Reembolso parcial",
  "reason": "Produto devolvido"
}

# Listar transações com reembolso
GET /api/refunds

# Info de reembolso
GET /api/refunds/info?transactionId=tx-123
```

### Partidas Dobradas

```bash
# Popular lançamentos
POST /api/journal/populate

# Validar integridade
GET /api/journal/validate
```

---

## 🎨 Exemplos de UI

### Card de Projeção

```
┌─────────────────────────────────────────────┐
│ 📅 Projeção de Fluxo de Caixa               │
│                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Receitas │ │ Despesas │ │  Saldo   │     │
│ │ +R$5.000 │ │ -R$3.500 │ │ +R$1.500 │     │
│ └──────────┘ └──────────┘ └──────────┘     │
│                                              │
│ Itens Projetados (15):                      │
│ ┌──────────────────────────────────────┐   │
│ │ 05/11 • Parcela 3/12 • -R$ 100       │   │
│ │ 10/11 • Fatura Nubank • -R$ 1.200    │   │
│ │ 15/11 • Salário • +R$ 5.000          │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Modal de Reembolso

```
┌─────────────────────────────────────────────┐
│ 💰 Criar Reembolso                          │
│                                              │
│ ℹ️  Compra no Supermercado                  │
│     Valor original: R$ 100,00               │
│                                              │
│ Conta: [Conta Corrente ▼]                  │
│                                              │
│ Valor: [50.00] [Reembolsar tudo (R$100)]   │
│                                              │
│ Descrição: [Reembolso: Compra...]          │
│                                              │
│ Motivo: [Produto devolvido]                │
│                                              │
│ [Cancelar] [Criar Reembolso]               │
└─────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Problema: Script de população falha

**Solução**:
```bash
# Verificar se há transações sem conta
SELECT * FROM transactions WHERE accountId IS NULL;

# Corrigir manualmente ou deletar
```

### Problema: Projeção não mostra itens

**Solução**:
```bash
# Verificar se há parcelas futuras
SELECT * FROM installments WHERE status = 'pending' AND dueDate > date('now');

# Verificar se há faturas abertas
SELECT * FROM invoices WHERE status IN ('open', 'partial');
```

### Problema: Reembolso não aparece

**Solução**:
```bash
# Verificar metadata da transação
SELECT metadata FROM transactions WHERE id = 'tx-123';

# Deve conter:
{
  "refunds": [...],
  "totalRefunded": 50.00,
  "refundStatus": "partially_refunded"
}
```

---

## 📈 Métricas de Sucesso

Após implementação, você deve ter:

- ✅ **100% de cobertura** de lançamentos contábeis
- ✅ **Sistema balanceado** (débitos = créditos)
- ✅ **Projeção funcionando** com todos os tipos de obrigações
- ✅ **Reembolsos rastreáveis** com histórico completo

---

## 🎯 Checklist Final

- [ ] Script de população executado com sucesso
- [ ] Validação retorna `isHealthy: true`
- [ ] Projeção aparece no dashboard
- [ ] Botão de reembolso aparece nas despesas
- [ ] Teste de reembolso parcial funciona
- [ ] Teste de reembolso total funciona
- [ ] Saldos estão corretos
- [ ] Relatórios funcionam normalmente

---

## 💡 Dicas

1. **Sempre faça backup** antes de executar scripts
2. **Valide após cada mudança** importante
3. **Teste em ambiente de desenvolvimento** primeiro
4. **Monitore performance** com muitos dados
5. **Use cache** para projeções frequentes

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do console
2. Valide integridade do sistema
3. Consulte a documentação completa em `IMPLEMENTACAO-NOVAS-FUNCIONALIDADES.md`
4. Restaure backup se necessário

---

**Pronto! Seu sistema agora tem funcionalidades profissionais de gestão financeira! 🎉**

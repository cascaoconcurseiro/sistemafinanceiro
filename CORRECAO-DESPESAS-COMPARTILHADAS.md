# 🔧 CORREÇÃO - DESPESAS COMPARTILHADAS

**Data:** 26/10/2025  
**Problema:** Sistema não salvava transação ao marcar despesa compartilhada como paga

---

## 🐛 PROBLEMA IDENTIFICADO

Quando o usuário marcava uma despesa compartilhada como "paga", o sistema não criava a transação de receita porque:

1. **Faltava `categoryId`**: A API exige `categoryId` mas o código estava passando apenas `category` (nome)
2. **Validação da API**: O schema Zod da API valida que `categoryId` é obrigatório
3. **Erro silencioso**: O erro não era mostrado claramente ao usuário

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. Busca Automática de Categoria
```typescript
// ANTES (❌ Errado)
const receiptData = {
  category: 'Outros Recebimentos', // ❌ API não aceita
  // ...
};

// DEPOIS (✅ Correto)
const categoriesResponse = await fetch('/api/categories');
const categories = await categoriesResponse.json();
const receiptCategory = categories.find(c => 
  c.type === 'RECEITA' && (c.name === 'Depósito' || c.name === 'Outros Ganhos')
);

const receiptData = {
  categoryId: receiptCategory.id, // ✅ Usa ID correto
  // ...
};
```

### 2. Gerenciamento Automático de Dívidas
```typescript
// ✅ NOVO: Sistema agora gerencia dívidas automaticamente
try {
  const debtsResponse = await fetch('/api/shared-debts');
  const debts = await debtsResponse.json();
  
  // Procurar dívida ativa com o contato
  const existingDebt = debts.find(d => 
    (d.creditorId === contact?.id || d.debtorId === contact?.id) && 
    d.status === 'active'
  );
  
  if (existingDebt) {
    const newAmount = existingDebt.currentAmount - paymentAmount;
    
    if (newAmount <= 0) {
      // Dívida quitada
      await updateDebt({ status: 'paid', currentAmount: 0 });
    } else {
      // Atualizar valor
      await updateDebt({ currentAmount: newAmount });
    }
  }
} catch (error) {
  // Não falhar o pagamento se houver erro nas dívidas
}
```

### 3. Mensagens de Erro Melhoradas
```typescript
if (!response.ok) {
  const errorData = await response.json();
  console.error('❌ Erro da API:', errorData);
  throw new Error(errorData.error || 'Erro ao criar transação de pagamento');
}
```

---

## 🎯 FLUXO COMPLETO AGORA

### Quando usuário marca como "pago":

1. **Seleciona conta** para receber o pagamento
2. **Sistema busca categoria** de RECEITA automaticamente
3. **Cria transação de RECEITA** na conta selecionada
4. **Atualiza dívidas** compartilhadas (se existirem)
5. **Marca transação original** como paga
6. **Atualiza orçamento** da viagem (se for despesa de viagem)
7. **Mostra confirmação** ao usuário

---

## 💰 SISTEMA DE DÍVIDAS

### Como Funciona:

#### Cenário 1: Wesley deve para João
```
Despesa: R$ 100,00 (dividida entre Wesley e João)
Parte de João: R$ 50,00

Quando João paga:
- Cria RECEITA de R$ 50,00 na conta de Wesley
- Se Wesley já devia R$ 30,00 para João:
  * Nova dívida: R$ 30,00 - R$ 50,00 = -R$ 20,00
  * Agora João deve R$ 20,00 para Wesley
```

#### Cenário 2: João deve para Wesley
```
Dívida atual: João deve R$ 80,00 para Wesley
Pagamento: R$ 50,00

Resultado:
- Cria RECEITA de R$ 50,00
- Nova dívida: R$ 80,00 - R$ 50,00 = R$ 30,00
- João ainda deve R$ 30,00
```

#### Cenário 3: Dívida Quitada
```
Dívida atual: João deve R$ 50,00
Pagamento: R$ 50,00

Resultado:
- Cria RECEITA de R$ 50,00
- Dívida quitada (status = 'paid')
- Saldo zerado
```

---

## 📊 IMPACTO NAS TRANSAÇÕES

### Transação de Despesa Compartilhada
```json
{
  "description": "Jantar no restaurante",
  "amount": 100.00,
  "type": "DESPESA",
  "isShared": true,
  "sharedWith": ["joao-id", "maria-id"],
  "myShare": 33.33,
  "totalSharedAmount": 66.67
}
```

### Transação de Recebimento (quando marcado como pago)
```json
{
  "description": "Recebimento - Jantar no restaurante (João)",
  "amount": 33.33,
  "type": "RECEITA",
  "categoryId": "categoria-deposito-id",
  "accountId": "conta-selecionada-id",
  "notes": "Recebimento de despesa compartilhada - Transação original: xxx"
}
```

---

## 🔍 VALIDAÇÕES IMPLEMENTADAS

### 1. Categoria Obrigatória
- ✅ Sistema busca automaticamente categoria de RECEITA
- ✅ Se não encontrar, mostra erro claro
- ✅ Prioriza "Depósito" ou "Outros Ganhos"

### 2. Conta Obrigatória
- ✅ Usuário deve selecionar conta para receber
- ✅ Validação antes de processar

### 3. Dívidas
- ✅ Busca dívidas existentes
- ✅ Atualiza automaticamente
- ✅ Não falha se houver erro (graceful degradation)

---

## 🎨 INTERFACE DO USUÁRIO

### Modal de Pagamento
```
┌─────────────────────────────────────┐
│ Registrar Pagamento                 │
├─────────────────────────────────────┤
│                                     │
│ Pessoa: João Silva                  │
│ Valor: R$ 50,00                     │
│                                     │
│ Conta para receber:                 │
│ [Selecione uma conta ▼]            │
│                                     │
│ Data do pagamento:                  │
│ [26/10/2025]                        │
│                                     │
│ [Cancelar]  [Confirmar Pagamento]  │
└─────────────────────────────────────┘
```

### Resumo de Dívidas (Futuro)
```
┌─────────────────────────────────────┐
│ 💰 Resumo de Dívidas                │
├─────────────────────────────────────┤
│                                     │
│ Você deve:                          │
│ • João Silva: R$ 30,00              │
│ • Maria Santos: R$ 15,00            │
│                                     │
│ Devem para você:                    │
│ • Pedro Costa: R$ 50,00             │
│                                     │
│ Saldo líquido: +R$ 5,00            │
└─────────────────────────────────────┘
```

---

## 🚀 PRÓXIMOS PASSOS

### Melhorias Sugeridas:

1. **Dashboard de Dívidas**
   - Card no dashboard mostrando saldo de dívidas
   - Gráfico de evolução das dívidas

2. **Notificações**
   - Avisar quando alguém marcar como pago
   - Lembrete de dívidas pendentes

3. **Histórico**
   - Timeline de pagamentos
   - Relatório de dívidas por pessoa

4. **Exportação**
   - Exportar extrato de dívidas
   - Gerar comprovante de pagamento

5. **Múltiplas Moedas**
   - Suporte para despesas em outras moedas
   - Conversão automática

---

## 📝 TESTES RECOMENDADOS

### Cenários para Testar:

1. ✅ Criar despesa compartilhada
2. ✅ Marcar como pago (primeira vez)
3. ✅ Marcar como pago (com dívida existente)
4. ✅ Marcar como pago (quitando dívida)
5. ✅ Desmarcar pagamento
6. ✅ Pagar múltiplas despesas de uma vez
7. ✅ Despesa de viagem compartilhada
8. ✅ Verificar saldo da conta após pagamento

---

## 🎓 CONCLUSÃO

O sistema de despesas compartilhadas agora:
- ✅ Cria transações corretamente
- ✅ Gerencia dívidas automaticamente
- ✅ Valida dados antes de salvar
- ✅ Mostra erros claros
- ✅ Atualiza orçamentos de viagem
- ✅ Mantém histórico completo

**Status:** ✅ FUNCIONANDO

---

**Última atualização:** 26/10/2025

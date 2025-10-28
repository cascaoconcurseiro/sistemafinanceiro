# Problemas Identificados - Despesas Compartilhadas

## 1. Transação de Recebimento não é Excluída

**Problema**: Ao desmarcar o pagamento de uma despesa compartilhada, a transação de recebimento (RECEITA) continua aparecendo em "Todas as Transações".

**Exemplo**:
- Despesa: "carro" - R$ 199.00 (compartilhada)
- Recebimento: "Recebimento - carro (Wesley)" - R$ 99.50 (RECEITA)

**Comportamento Esperado**: Quando desmarcar o pagamento, a transação de recebimento deve ser excluída automaticamente.

**Localização**: 
- Componente: `shared-expenses.tsx`
- Função: `handlePaymentToggle` ou similar

---

## 2. Despesa Paga Desaparece da Lista de Compartilhadas

**Problema**: Após pagar uma despesa compartilhada (ex: "Pagamento de dívida - Alomoco"), ela desaparece completamente da lista de despesas compartilhadas.

**Comportamento Esperado**: A despesa deve permanecer na lista, mas marcada como "PAGA" ou em uma seção separada de "Despesas Pagas".

**Solução Sugerida**:
- Adicionar seção "Despesas Pagas" abaixo das pendentes
- Ou manter na lista com badge "PAGO" e estilo diferenciado

---

## 3. Novas Despesas Aparecem como Pagas Incorretamente

**Problema**: 
1. Usuário recebe uma despesa e marca como paga
2. Depois, uma NOVA despesa compartilhada é criada
3. A nova despesa aparece na fatura vigente JÁ MARCADA COMO PAGA (incorreto!)

**Comportamento Esperado**:
- Apenas despesas que foram EXPLICITAMENTE marcadas como pagas devem aparecer como pagas
- Novas despesas devem SEMPRE aparecer como PENDENTES
- Funcionar como cartão de crédito: nova compra = nova pendência

**Causa Provável**: 
- Lógica de "fatura vigente" está marcando todas as despesas como pagas
- Falta verificação individual do status de pagamento de cada despesa

---

## 4. Lógica de Faturas Precisa Ser Revista

**Comportamento Correto de Faturas**:

### Fatura Aberta (Vigente):
- Todas as despesas NOVAS devem aparecer como PENDENTES
- Usuário pode marcar individualmente como PAGA
- Ao fechar a fatura, todas as pendentes vão para a próxima

### Fatura Fechada:
- Apenas despesas que foram PAGAS ficam nela
- Despesas não pagas vão para a próxima fatura
- Não aceita novas despesas

### Nova Fatura:
- Começa vazia ou com despesas não pagas da anterior
- Novas despesas aparecem como PENDENTES

---

## Prioridade de Correção

1. **CRÍTICO**: Problema #3 - Novas despesas aparecem como pagas
2. **ALTO**: Problema #1 - Transação de recebimento não é excluída
3. **MÉDIO**: Problema #2 - Despesa paga desaparece da lista
4. **ALTO**: Problema #4 - Revisar lógica completa de faturas

---

## Arquivos a Verificar

1. `src/components/features/shared-expenses/shared-expenses.tsx`
2. `src/app/api/shared-debts/route.ts`
3. `src/app/api/transactions/route.ts`
4. Lógica de criação/atualização de transações de recebimento

---

## Próximos Passos

1. Verificar como as transações de recebimento são criadas
2. Implementar exclusão automática ao desmarcar pagamento
3. Corrigir lógica de status de pagamento (não herdar de fatura)
4. Adicionar seção de "Despesas Pagas" na lista
5. Revisar lógica completa de faturas para funcionar como cartão de crédito

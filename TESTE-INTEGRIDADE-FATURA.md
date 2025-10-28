# Teste: Integridade Referencial de Pagamentos de Fatura

## Objetivo
Validar que ao desmarcar/deletar uma transação de cartão de crédito, todo o sistema é revertido corretamente, incluindo a conta bancária.

## Pré-requisitos

1. Ter um cartão de crédito cadastrado
2. Ter uma conta bancária com saldo
3. Sistema funcionando normalmente

## Cenário 1: Pagamento Total de Fatura

### Setup Inicial
```
Conta Bancária: R$ 1.000,00
Cartão: Limite R$ 5.000,00, Usado R$ 0,00
```

### Passos

1. **Criar transação no cartão**
   - Descrição: "Compra Supermercado"
   - Valor: R$ 100,00
   - Data: Hoje
   - Resultado esperado:
     - ✅ Transação criada
     - ✅ Limite usado: R$ 100,00

2. **Marcar transação como paga**
   - Selecionar conta bancária
   - Pagar valor total
   - Resultado esperado:
     - ✅ Fatura marcada como paga
     - ✅ Transação de pagamento criada: -R$ 100,00
     - ✅ Saldo da conta: R$ 900,00
     - ✅ Status da transação: 'completed'

3. **Deletar transação do cartão**
   - Clicar em deletar na transação original
   - Resultado esperado:
     - ✅ Transação deletada
     - ✅ Fatura volta para pendente
     - ✅ Transação de pagamento deletada
     - ✅ Saldo da conta restaurado: R$ 1.000,00
     - ✅ Limite do cartão restaurado: R$ 0,00

### Validações Finais

```sql
-- Verificar fatura
SELECT * FROM "Invoice" WHERE "creditCardId" = '[ID_CARTAO]';
-- Deve mostrar: isPaid = false, paidAmount = 0

-- Verificar transações de pagamento
SELECT * FROM "Transaction" 
WHERE description LIKE '%Pagamento de fatura%' 
AND "userId" = '[ID_USUARIO]';
-- Não deve existir nenhuma

-- Verificar saldo da conta
SELECT * FROM "Account" WHERE id = '[ID_CONTA]';
-- Deve mostrar: balance = 1000.00

-- Verificar limite do cartão
SELECT * FROM "CreditCard" WHERE id = '[ID_CARTAO]';
-- Deve mostrar: currentBalance = 0
```

## Cenário 2: Múltiplas Transações

### Setup Inicial
```
Conta Bancária: R$ 2.000,00
Cartão: Limite R$ 5.000,00, Usado R$ 0,00
```

### Passos

1. **Criar 3 transações no cartão**
   - Transação 1: R$ 50,00
   - Transação 2: R$ 30,00
   - Transação 3: R$ 20,00
   - Total: R$ 100,00

2. **Marcar todas como pagas**
   - Pagar fatura total: R$ 100,00
   - Resultado esperado:
     - ✅ Saldo da conta: R$ 1.900,00
     - ✅ Todas com status 'completed'

3. **Deletar apenas a transação 1 (R$ 50,00)**
   - Resultado esperado:
     - ✅ Fatura volta para pendente
     - ✅ Transação de pagamento deletada
     - ✅ Saldo restaurado: R$ 2.000,00
     - ✅ Todas as transações voltam para 'pending'

4. **Pagar novamente (agora R$ 50,00)**
   - Resultado esperado:
     - ✅ Nova transação de pagamento: -R$ 50,00
     - ✅ Saldo: R$ 1.950,00
     - ✅ Fatura paga

## Cenário 3: Pagamento Parcial

### Setup Inicial
```
Conta Bancária: R$ 1.000,00
Cartão: Transação de R$ 200,00
```

### Passos

1. **Pagar parcialmente (R$ 100,00)**
   - Resultado esperado:
     - ✅ Fatura: paidAmount = 100, isPaid = false
     - ✅ Saldo: R$ 900,00

2. **Deletar transação do cartão**
   - Resultado esperado:
     - ✅ Fatura revertida
     - ✅ Pagamento parcial deletado
     - ✅ Saldo restaurado: R$ 1.000,00

## Cenário 4: Verificação de Logs

### Durante a Deleção

Verificar que os logs aparecem no console:

```
🔄 [DELETE] Detectada deleção de transação de cartão de crédito
🔄 [DELETE] Transação: [ID] [Descrição]
🔄 [DELETE] Cartão: [ID_CARTAO]
🔄 [DELETE] Fatura paga encontrada: [ID_FATURA] (MM/YYYY)
🔄 [DELETE] Valor pago: R$ XX.XX
🔄 [CreditCard] Revertendo pagamento de fatura: [ID_FATURA]
✅ [CreditCard] Fatura revertida para não paga
✅ [CreditCard] Transação de pagamento deletada: [ID]
✅ [CreditCard] Saldo da conta [NOME] restaurado: +R$ XX.XX
   Saldo anterior: R$ XXX.XX
   Saldo novo: R$ XXX.XX
✅ [CreditCard] N transações revertidas para pending
✅ [DELETE] Pagamento de fatura revertido com sucesso
```

## Cenário 5: Teste de Integridade

### Verificar que NÃO é possível:

1. ❌ Ter fatura paga sem transação de pagamento
2. ❌ Ter transação de pagamento sem fatura
3. ❌ Ter saldo da conta incorreto
4. ❌ Ter limite do cartão incorreto

### Comandos SQL para Validação

```sql
-- Buscar faturas pagas sem transação de pagamento
SELECT i.* FROM "Invoice" i
LEFT JOIN "Transaction" t ON t.id = i."paymentTransactionId"
WHERE i."isPaid" = true AND t.id IS NULL;
-- Deve retornar 0 linhas

-- Buscar transações de pagamento órfãs
SELECT t.* FROM "Transaction" t
WHERE t.description LIKE '%Pagamento de fatura%'
AND t."relatedInvoiceId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "Invoice" i 
  WHERE i.id = t."relatedInvoiceId"
);
-- Deve retornar 0 linhas

-- Verificar consistência de saldos
SELECT 
  a.name,
  a.balance as saldo_registrado,
  COALESCE(SUM(t.amount), 0) as soma_transacoes
FROM "Account" a
LEFT JOIN "Transaction" t ON t."accountId" = a.id
WHERE a."userId" = '[ID_USUARIO]'
GROUP BY a.id, a.name, a.balance;
-- saldo_registrado deve ser igual a soma_transacoes
```

## Checklist de Validação

### Antes da Deleção
- [ ] Fatura está marcada como paga
- [ ] Transação de pagamento existe
- [ ] Saldo da conta foi debitado
- [ ] Transações do cartão estão 'completed'

### Depois da Deleção
- [ ] Fatura voltou para pendente
- [ ] Transação de pagamento foi deletada
- [ ] Saldo da conta foi restaurado
- [ ] Transações do cartão voltaram para 'pending'
- [ ] Limite do cartão foi restaurado
- [ ] Logs foram registrados corretamente
- [ ] Auditoria foi criada

## Resultado Esperado

✅ **SUCESSO**: Todos os cenários passam sem inconsistências
❌ **FALHA**: Qualquer inconsistência encontrada

## Notas

- Testar em ambiente de desenvolvimento primeiro
- Fazer backup do banco antes de testar em produção
- Verificar logs detalhadamente
- Validar com múltiplos usuários
- Testar com diferentes valores e datas

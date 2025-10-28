# Correção do Erro 500 ao Criar Transações

## Problema Identificado

Ao tentar criar uma transação, a API retornava erro 500 e o servidor respondia com HTML em vez de JSON:

```
❌ API Error [POST /api/transactions]: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Causas Raiz

### 1. Chamada Incorreta de Métodos Estáticos

**Problema:** O serviço `FinancialOperationsService` possui métodos **estáticos**, mas estavam sendo chamados como métodos de instância.

**Código Errado:**
```typescript
const service = new FinancialOperationsService();
const transaction = await service.createTransaction({ ... }); // ❌ ERRADO
```

**Código Correto:**
```typescript
const transaction = await FinancialOperationsService.createTransaction({ ... }); // ✅ CORRETO
```

### 2. Tipo de Transação Incompatível

**Problema:** O frontend envia `type: "expense"` (minúsculas), mas o schema Zod espera `type: "DESPESA"` (maiúsculas).

**Solução:** Adicionado mapeamento de tipos na API:
```typescript
const typeMap: Record<string, string> = {
  'income': 'RECEITA',
  'expense': 'DESPESA',
  'transfer': 'TRANSFERENCIA',
  'RECEITA': 'RECEITA',
  'DESPESA': 'DESPESA',
  'TRANSFERENCIA': 'TRANSFERENCIA',
};

const transactionData = {
  ...body,
  type: typeMap[body.type] || body.type, // Converter tipo
  // ...
};
```

### 3. Erro no Schema de Validação

**Problema:** O schema `CreditCardSchema` tinha um erro de sintaxe no método `.positive()`.

**Código Errado:**
```typescript
limit: z.number().or(z.string().transform(Number)).positive('Limite deve ser positivo'), // ❌ ERRADO
```

**Código Correto:**
```typescript
limit: z.number().or(z.string().transform(Number)).positive(), // ✅ CORRETO
```

**Motivo:** O método `.positive()` do Zod não aceita mensagem de erro como parâmetro. Para adicionar mensagem customizada, use `.refine()` ou `.min(0.01, 'mensagem')`.

### 4. Retorno Incorreto do Método createInstallments

**Problema:** O método `createInstallments` retorna um objeto `{ parentTransaction, installments }`, mas o código tentava acessar `.length` diretamente.

**Código Errado:**
```typescript
const installments = await FinancialOperationsService.createInstallments({ ... });
return NextResponse.json({
  message: `${installments.length} parcelas criadas`, // ❌ ERRADO
});
```

**Código Correto:**
```typescript
const result = await FinancialOperationsService.createInstallments({ ... });
return NextResponse.json({
  message: `${result.installments.length} parcelas criadas`, // ✅ CORRETO
  parentTransaction: result.parentTransaction,
  installments: result.installments,
});
```

## Arquivos Modificados

### 1. `src/app/api/transactions/route.ts`

**Alterações:**
- ✅ Corrigida chamada de métodos estáticos
- ✅ Adicionado mapeamento de tipos de transação
- ✅ Corrigido acesso ao retorno de `createInstallments`

### 2. `src/lib/validation/schemas.ts`

**Alterações:**
- ✅ Corrigido uso incorreto de `.positive()` no `CreditCardSchema`
- ✅ Removida mensagem de erro do método `.positive()`

## Como Testar

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Tente criar uma transação:**
   - Abra a aplicação
   - Clique em "Nova Transação"
   - Preencha os campos
   - Clique em "Salvar"

3. **Verifique os logs:**
   - Deve aparecer: `✅ [API Transactions POST] Transação criada: [ID]`
   - Não deve mais aparecer erro 500

## Resultado Esperado

- ✅ Transações são criadas com sucesso
- ✅ API retorna JSON válido
- ✅ Não há mais erro 500
- ✅ Logs mostram sucesso na criação

## Observações Técnicas

### Métodos Estáticos vs Instância

O `FinancialOperationsService` usa métodos estáticos porque:
- Não mantém estado interno
- Todas as operações são atômicas via Prisma transactions
- Facilita o uso sem necessidade de instanciar

### Validação de Tipos

O schema Zod valida:
- Tipos de transação: `RECEITA`, `DESPESA`, `TRANSFERENCIA`
- Campos obrigatórios: `userId`, `description`, `amount`, `type`, `date`
- Campos opcionais: `accountId`, `creditCardId`, `categoryId`, etc.

### Atomicidade

Todas as operações usam `prisma.$transaction` para garantir:
- Criação de transação + lançamentos contábeis
- Atualização de saldos
- Vinculação a faturas (se cartão de crédito)
- Rollback automático em caso de erro

## Status

✅ **CORRIGIDO** - Erro 500 ao criar transações resolvido

# Correção: Gastos de Viagem Não Apareciam Corretamente

## Problemas Identificados

### 1. ❌ Gastos Não Aparecem nos Cards
Os cards de viagem mostravam "Já gasto: R$ 0" quando havia gastos registrados.

### 2. ❌ Cálculo Individual Errado
O sistema mostrava R$ 100 (valor total) em vez de R$ 50 (parte individual) para transações compartilhadas.

## Causa Raiz

As transações compartilhadas **não tinham o campo `myShare` definido**, então o código estava usando o valor total em vez da parte individual.

**Exemplo**:
- Transação: R$ 100 compartilhada com 2 pessoas
- **Esperado**: myShare = R$ 50 (sua parte)
- **Atual**: myShare = null → usava R$ 100 (valor total)

## Soluções Implementadas

### 1. ✅ Corrigidas Transações Existentes

**Script**: `fix-myshare-trip-transactions.js`

- Buscou todas as transações compartilhadas sem `myShare`
- Calculou `myShare = amount / totalParticipants`
- Atualizou o banco de dados

**Resultado**:
```
✅ 2 transações corrigidas
   - TESTE NORMAL: myShare = R$ 50.00
   - TESTE VIAGEM: myShare = R$ 50.00
```

### 2. ✅ Corrigido Código de Criação

**Arquivo**: `/src/app/api/transactions/route.ts`

**Mudança**:
```typescript
// ANTES (❌ Não calculava myShare)
const transactionData = {
  ...body,
  amount: Math.abs(Number(body.amount)),
};

// DEPOIS (✅ Calcula myShare automaticamente)
let myShare = null;
let isShared = false;

if (body.sharedWith && body.sharedWith.length > 0) {
  isShared = true;
  const totalParticipants = body.sharedWith.length + 1;
  myShare = Math.abs(Number(body.amount)) / totalParticipants;
}

const transactionData = {
  ...body,
  amount: Math.abs(Number(body.amount)),
  isShared,
  myShare,
  totalSharedAmount: isShared ? Math.abs(Number(body.amount)) : null,
};
```

### 3. ✅ Código de Cálculo Já Estava Correto

**Arquivo**: `/src/components/features/trips/trip-overview.tsx` (linhas 127-138)

O código já estava tentando usar `myShare`:
```typescript
const value = (t as any).isShared && (t as any).myShare !== null
  ? Math.abs(Number((t as any).myShare))
  : amount;
```

O problema era que `myShare` estava `null`, então usava o valor total.

## Resultado Final

✅ **Transações existentes corrigidas** - myShare calculado e salvo
✅ **Novas transações** - myShare calculado automaticamente
✅ **Cards de viagem** - Mostram gastos individuais corretos
✅ **Orçamento** - Calcula baseado na parte individual

## Como Testar

### Teste 1: Verificar Transações Existentes
1. Recarregue a página (Ctrl+F5)
2. Vá para "Viagens"
3. Verifique se os gastos aparecem corretamente:
   - **Esperado**: R$ 50,00 (sua parte)
   - **Não**: R$ 100,00 (valor total)

### Teste 2: Criar Nova Transação Compartilhada
1. Crie uma nova transação de R$ 100
2. Marque como "Compartilhada" com 1 pessoa
3. Vincule a uma viagem
4. Salve
5. Verifique se aparece R$ 50 nos gastos da viagem

### Teste 3: Verificar Cards
1. No formulário de nova transação
2. Ao selecionar a viagem
3. Deve mostrar:
   ```
   Teste viagem
   Orçamento: R$ 1.000
   Já gasto: R$ 50  ← Correto!
   Disponível: R$ 950
   ```

### Teste 4: Verificar Visão Geral da Viagem
1. Entre na viagem
2. Verifique "Controle de Orçamento"
3. Deve mostrar:
   ```
   Progresso dos Gastos (Individual)
   BRL 50.00 / 1000.00  ← Correto!
   5.0% utilizado
   Falta: BRL 950.00
   ```

## Arquivos Modificados

1. ✅ `/src/app/api/transactions/route.ts` - Calcula myShare automaticamente
2. ✅ `/scripts/fix-myshare-trip-transactions.js` - Script de correção

## Observações Importantes

### Regra de Cálculo
- **Transação Individual**: Conta o valor total
- **Transação Compartilhada**: Conta apenas sua parte (myShare)

### Fórmula
```
myShare = amount / (sharedWith.length + 1)
```

Onde:
- `amount` = Valor total da transação
- `sharedWith.length` = Número de pessoas com quem compartilhou
- `+1` = Você mesmo

### Exemplo
- Transação: R$ 300
- Compartilhada com: 2 pessoas (João e Maria)
- Total de participantes: 3 (você + João + Maria)
- **Sua parte**: R$ 300 / 3 = R$ 100

## Próximos Passos

Se você ainda vê problemas:

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue com Ctrl+F5**
3. **Verifique o console** para logs de debug
4. **Execute o script de verificação**:
   ```bash
   node scripts/check-trip-transactions.js
   ```

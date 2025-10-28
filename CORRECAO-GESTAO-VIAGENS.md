# Correção: Gestão de Viagens - Status e Sincronização

## 🐛 Problemas Identificados

### 1. Status da Viagem Não Atualiza Automaticamente
**Problema**: A viagem está em andamento (26/10/2025 - 27/10/2025), mas ainda aparece como "planned" (planejada).

**Causa**: Não existe lógica para atualizar automaticamente o status da viagem baseado nas datas.

### 2. Estatísticas Não Refletem Gastos Reais
**Problema**: O painel mostra "Total Gasto: R$ 0,00", mas não está sincronizado com as transações vinculadas à viagem.

**Causa**: O campo `spent` da viagem não é calculado automaticamente a partir das transações com `tripId`.

## ✅ Soluções Implementadas

### 1. Atualização Automática de Status
Adicionar lógica para determinar o status baseado nas datas:
- **planned**: Data de início no futuro
- **active**: Entre data de início e fim
- **completed**: Data de fim no passado

### 2. Sincronização de Gastos
Calcular automaticamente o campo `spent` somando todas as transações com `tripId` correspondente.

### 3. Normalização de Status
Garantir que os status sejam consistentes em todo o sistema (planned/active/completed).

## 📝 Arquivos a Modificar

1. **src/app/trips/page.tsx** - Adicionar lógica de status dinâmico
2. **src/contexts/unified-financial-context.tsx** - Calcular gastos automaticamente
3. **src/app/api/trips/route.ts** - Atualizar API para calcular gastos

## 🔧 Implementação

### Passo 1: Adicionar função para determinar status
```typescript
const getTripStatus = (startDate: string, endDate: string): 'planned' | 'active' | 'completed' => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'planned';
  if (now >= start && now <= end) return 'active';
  return 'completed';
};
```

### Passo 2: Calcular gastos da viagem
```typescript
const calculateTripSpent = (tripId: string, transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.tripId === tripId && t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};
```

### Passo 3: Atualizar trips no contexto
```typescript
const tripsWithCalculatedData = useMemo(() => {
  return (data?.trips || []).map(trip => {
    const spent = calculateTripSpent(trip.id, transactions);
    const status = getTripStatus(trip.startDate, trip.endDate);
    return { ...trip, spent, status };
  });
}, [data?.trips, transactions]);
```

## 🎯 Resultado Esperado

Após as correções:
1. ✅ Status da viagem atualiza automaticamente baseado nas datas
2. ✅ Total gasto reflete as transações vinculadas à viagem
3. ✅ Estatísticas do painel mostram valores corretos
4. ✅ Utilização do orçamento calculada corretamente

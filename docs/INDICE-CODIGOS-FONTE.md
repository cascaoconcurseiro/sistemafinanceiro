# 📚 ÍNDICE DE CÓDIGOS FONTE - SISTEMA COMPLETO

## 📋 Organização dos Arquivos

Este documento serve como índice para todos os códigos fonte do sistema de despesas compartilhadas e viagens.

---

## 🗂️ ESTRUTURA DE ARQUIVOS

### 1. FORMULÁRIO DE NOVA TRANSAÇÃO
**Arquivo:** `CODIGO-FONTE-add-transaction-modal.tsx`  
**Localização Original:** `src/components/modals/transactions/add-transaction-modal.tsx`  
**Linhas:** 2691  
**Descrição:** Modal principal para criar transações (receitas, despesas, compartilhadas, viagens)

**Principais Funcionalidades:**
- ✅ Criação de transações simples
- ✅ Despesas compartilhadas com divisão
- ✅ Vinculação a viagens
- ✅ Parcelamento
- ✅ Transações pagas por outros
- ✅ Conversão de moedas
- ✅ Recorrência

**Componentes Principais:**
```typescript
interface FormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  date: string;
  account: string;
  category: string;
  isShared: boolean;
  selectedContacts: string[];
  tripId: string;
  installments: number;
  isPaidBy: boolean;
  paidByPerson: string;
}

function AddTransactionModal({
  open,
  onOpenChange,
  onSave,
  editingTransaction,
  tripId
}: AddTransactionModalProps)
```

**Fluxo:**
1. Usuário preenche formulário
2. Valida dados (conta, valor, data)
3. Calcula compartilhamento (se aplicável)
4. Envia para `POST /api/transactions`
5. API cria transação + dívidas
6. Atualiza contexto e fecha modal

---

### 2. PÁGINA DE VIAGENS
**Arquivo:** `CODIGO-FONTE-trips-page.tsx`  
**Localização Original:** `src/app/trips/page.tsx`  
**Linhas:** 400+  
**Descrição:** Página principal de listagem e gerenciamento de viagens

**Principais Funcionalidades:**
- ✅ Lista todas as viagens
- ✅ Estatísticas gerais (total gasto, orçamento, etc)
- ✅ Filtros por status (planejamento, andamento, concluída)
- ✅ Criação de nova viagem
- ✅ Edição de viagem
- ✅ Visualização de detalhes

**Componentes Principais:**
```typescript
interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planejamento' | 'andamento' | 'concluida';
}

interface TravelStats {
  totalTrips: number;
  totalSpent: number;
  totalBudget: number;
  activeTrips: number;
  completedTrips: number;
  averageSpent: number;
  budgetUtilization: number;
}

export default function TripsPage()
```

**Fluxo:**
1. Carrega viagens do contexto
2. Calcula estatísticas
3. Agrupa por status
4. Exibe cards de viagens
5. Permite criar/editar viagens

---

### 3. VISÃO GERAL DA VIAGEM
**Arquivo:** `CODIGO-FONTE-trip-overview.tsx`  
**Localização Original:** `src/components/features/trips/trip-overview.tsx`  
**Linhas:** 890  
**Descrição:** Componente detalhado de uma viagem específica

**Principais Funcionalidades:**
- ✅ Resumo financeiro (orçamento vs gasto)
- ✅ Lista de despesas da viagem
- ✅ Gerenciamento de participantes
- ✅ Progresso de documentos e checklist
- ✅ Edição de informações da viagem
- ✅ Controle de orçamento individual

**Componentes Principais:**
```typescript
interface TripOverviewProps {
  trip: Trip;
  onUpdate?: (trip: Trip) => void;
}

export function TripOverview({ trip, onUpdate }: TripOverviewProps)
```

**Fluxo:**
1. Carrega transações da viagem
2. Calcula gasto individual (myShare)
3. Exibe progresso do orçamento
4. Permite gerenciar participantes
5. Permite editar viagem

---

### 4. DESPESAS COMPARTILHADAS (PRINCIPAL)
**Arquivo:** `CODIGO-FONTE-shared-expenses.tsx`  
**Localização Original:** `src/components/features/shared-expenses/shared-expenses.tsx`  
**Linhas:** 300+  
**Descrição:** Página principal de despesas compartilhadas

**Principais Funcionalidades:**
- ✅ Abas (Pendentes / Histórico)
- ✅ Lista de dívidas ativas
- ✅ Lista de créditos (quem te deve)
- ✅ Histórico de pagamentos
- ✅ Resumo financeiro

**Componentes Principais:**
```typescript
export function SharedExpenses()
```

**Fluxo:**
1. Busca dívidas via `GET /api/debts`
2. Separa em pendentes e pagas
3. Agrupa por pessoa
4. Exibe em abas
5. Permite pagar via fatura consolidada

---

### 5. LISTA DE DÍVIDAS PENDENTES
**Arquivo:** `CODIGO-FONTE-pending-debts-list.tsx`  
**Localização Original:** `src/components/features/shared-expenses/pending-debts-list.tsx`  
**Linhas:** 200+  
**Descrição:** Lista de dívidas pendentes agrupadas por credor

**Principais Funcionalidades:**
- ✅ Agrupa dívidas por pessoa
- ✅ Mostra total por pessoa
- ✅ Botão "Pagar Tudo"
- ✅ Detalhes de cada dívida

**Componentes Principais:**
```typescript
interface Debt {
  id: string;
  creditorId: string;
  debtorId: string;
  currentAmount: number;
  description: string;
  status: 'active' | 'paid';
}

interface PendingDebtsListProps {
  debts: Debt[];
  onUpdate?: () => void;
}

export function PendingDebtsList({ debts, onUpdate }: PendingDebtsListProps)
```

**Fluxo:**
1. Recebe lista de dívidas
2. Agrupa por credor
3. Calcula total por pessoa
4. Exibe cards com detalhes
5. Abre modal de pagamento

---

### 6. FATURA CONSOLIDADA (BILLING)
**Arquivo:** `CODIGO-FONTE-shared-expenses-billing.tsx`  
**Localização Original:** `src/components/features/shared-expenses/shared-expenses-billing.tsx`  
**Linhas:** 1647  
**Descrição:** Sistema de fatura consolidada para pagamento de múltiplas dívidas

**Principais Funcionalidades:**
- ✅ Agrupa itens por pessoa
- ✅ Separa créditos (te devem) e débitos (você deve)
- ✅ Permite selecionar itens para pagar
- ✅ Cria transações de pagamento/recebimento
- ✅ Marca dívidas como pagas
- ✅ Exporta para CSV

**Componentes Principais:**
```typescript
interface BillingItem {
  id: string;
  transactionId: string;
  userEmail: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  type: 'CREDIT' | 'DEBIT';
  paidBy?: string;
}

interface SharedExpensesBillingProps {
  mode: 'regular' | 'trip';
}

export const SharedExpensesBilling = memo(function SharedExpensesBilling({ 
  mode 
}: SharedExpensesBillingProps)
```

**Fluxo:**
1. Carrega transações compartilhadas
2. Carrega dívidas
3. Converte em itens de fatura
4. Agrupa por pessoa
5. Permite pagar selecionados
6. Cria transações de pagamento
7. Marca como pago

---

## 🔗 CONEXÕES ENTRE ARQUIVOS

```
┌─────────────────────────────────────────────────────────────┐
│                  FORMULÁRIO DE TRANSAÇÃO                    │
│           (add-transaction-modal.tsx)                       │
│                                                             │
│  • Cria transações simples                                 │
│  • Cria transações compartilhadas                          │
│  • Vincula a viagens                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API DE TRANSAÇÕES                        │
│              POST /api/transactions                         │
│                                                             │
│  • Valida dados                                            │
│  • Cria transação no banco                                 │
│  • Cria dívidas (se compartilhada)                         │
└──────────────┬────────────────────────┬─────────────────────┘
               │                        │
               ▼                        ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   PÁGINA DE VIAGENS      │  │  DESPESAS COMPARTILHADAS     │
│   (trips-page.tsx)       │  │  (shared-expenses.tsx)       │
│                          │  │                              │
│  • Lista viagens         │  │  • Lista dívidas             │
│  • Mostra gastos         │  │  • Mostra créditos           │
└──────────┬───────────────┘  └──────────┬───────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  VISÃO DA VIAGEM         │  │  LISTA DE DÍVIDAS            │
│  (trip-overview.tsx)     │  │  (pending-debts-list.tsx)    │
│                          │  │                              │
│  • Detalhes da viagem    │  │  • Agrupa por pessoa         │
│  • Gastos individuais    │  │  • Botão "Pagar Tudo"        │
│  • Participantes         │  └──────────┬───────────────────┘
└──────────────────────────┘             │
                                         ▼
                          ┌──────────────────────────────────┐
                          │  FATURA CONSOLIDADA              │
                          │  (shared-expenses-billing.tsx)   │
                          │                                  │
                          │  • Agrupa itens                  │
                          │  • Permite pagar                 │
                          │  • Cria transações               │
                          └──────────────────────────────────┘
```

---

## 📊 FLUXO DE DADOS COMPLETO

### Cenário: Despesa Compartilhada em Viagem

```
1. USUÁRIO CRIA DESPESA
   ├─ Abre: add-transaction-modal.tsx
   ├─ Preenche: descrição, valor, categoria
   ├─ Seleciona: viagem (tripId)
   ├─ Marca: compartilhada
   ├─ Seleciona: participantes
   └─ Clica: Salvar

2. FORMULÁRIO PROCESSA
   ├─ Valida dados
   ├─ Calcula divisão (myShare)
   ├─ Envia: POST /api/transactions
   └─ Aguarda resposta

3. API CRIA REGISTROS
   ├─ Cria: Transaction (despesa)
   ├─ Atualiza: Saldo da conta
   ├─ Cria: JournalEntry (partidas dobradas)
   ├─ Cria: SharedDebt (para cada participante)
   └─ Retorna: sucesso

4. SISTEMA ATUALIZA
   ├─ Contexto: refreshTransactions()
   ├─ Viagem: atualiza spent
   ├─ Dívidas: aparecem em pendentes
   └─ UI: reflete mudanças

5. USUÁRIO VISUALIZA
   ├─ trips-page.tsx: vê gasto atualizado
   ├─ trip-overview.tsx: vê detalhes
   ├─ shared-expenses.tsx: vê dívidas
   └─ pending-debts-list.tsx: vê quem deve

6. PARTICIPANTE PAGA
   ├─ Abre: shared-expenses-billing.tsx
   ├─ Seleciona: itens a pagar
   ├─ Escolhe: conta
   ├─ Confirma: pagamento
   └─ Sistema: cria transação de recebimento

7. SISTEMA FINALIZA
   ├─ Cria: Transaction (receita)
   ├─ Atualiza: Saldo da conta
   ├─ Marca: SharedDebt como paid
   └─ UI: move para histórico
```

---

## 🎯 COMO USAR ESTES CÓDIGOS

### Para Estudar
1. Comece pelo **INDICE-CODIGOS-FONTE.md** (este arquivo)
2. Leia a descrição de cada componente
3. Entenda o fluxo de dados
4. Abra o código fonte específico

### Para Implementar
1. Use como referência para novos recursos
2. Copie estruturas similares
3. Adapte conforme necessário
4. Mantenha os padrões

### Para Debugar
1. Identifique qual arquivo está envolvido
2. Procure a função específica
3. Adicione logs
4. Teste isoladamente

---

## 📝 CONVENÇÕES DE CÓDIGO

### Nomenclatura
- **Componentes:** PascalCase (ex: `AddTransactionModal`)
- **Funções:** camelCase (ex: `handleSubmit`)
- **Interfaces:** PascalCase com sufixo Props (ex: `TripOverviewProps`)
- **Constantes:** UPPER_SNAKE_CASE (ex: `MAX_INSTALLMENTS`)

### Estrutura de Arquivos
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Interfaces/Types
interface ComponentProps {
  // ...
}

// 3. Componente Principal
export function Component({ props }: ComponentProps) {
  // 3.1 Estados
  const [state, setState] = useState();
  
  // 3.2 Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 3.3 Funções
  const handleAction = () => {
    // ...
  };
  
  // 3.4 Render
  return (
    // JSX
  );
}
```

### Comentários
```typescript
// ✅ CORREÇÃO: Descrição do que foi corrigido
// ❌ PROBLEMA: Descrição do problema
// 🔍 DEBUG: Log para debug
// 💡 NOTA: Informação importante
// TODO: Tarefa pendente
```

---

## 🔧 FERRAMENTAS E DEPENDÊNCIAS

### Principais Bibliotecas
- **React**: Framework UI
- **Next.js**: Framework full-stack
- **TypeScript**: Tipagem estática
- **Zod**: Validação de schemas
- **Prisma**: ORM para banco de dados
- **Tailwind CSS**: Estilização
- **shadcn/ui**: Componentes UI

### Hooks Personalizados
- `useUnifiedFinancial()`: Contexto financeiro global
- `useTransactions()`: Lista de transações
- `useAccounts()`: Lista de contas
- `useTrips()`: Lista de viagens
- `useContacts()`: Lista de contatos

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **CODIGOS-COMPLETOS-DESPESAS-COMPARTILHADAS.md**: Documentação técnica completa
- **SISTEMA-DESPESAS-COMPARTILHADAS-COMPLETO.md**: Visão geral do sistema
- **PARTIDAS-DOBRADAS-COMPARTILHADAS.md**: Explicação contábil

---

**Última Atualização:** 18/11/2024  
**Versão:** 1.0  
**Autor:** Sistema de Documentação Automática


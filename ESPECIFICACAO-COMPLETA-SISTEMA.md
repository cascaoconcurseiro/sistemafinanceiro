# ESPECIFICAÇÃO COMPLETA DO SISTEMA DE GESTÃO FINANCEIRA

## ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Modelo de Dados](#modelo-de-dados)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Formulários e Interfaces](#formulários-e-interfaces)
6. [Fluxos de Negócio](#fluxos-de-negócio)
7. [APIs e Integrações](#apis-e-integrações)
8. [Regras de Negócio](#regras-de-negócio)

---

## 1. VISÃO GERAL

### 1.1 Propósito do Sistema
Sistema completo de gestão financeira pessoal e familiar com suporte a:
- Controle de receitas e despesas
- Gestão de contas bancárias e cartões de crédito
- Despesas compartilhadas entre membros da família
- Planejamento e controle de viagens
- Parcelamento de compras
- Investimentos e metas financeiras
- Orçamentos e relatórios

### 1.2 Tecnologias Utilizadas
- **Frontend**: React 18, TypeScript, Next.js 14
- **Backend**: Next.js API Routes
- **Banco de Dados**: SQLite com Prisma ORM
- **UI**: shadcn/ui, Tailwind CSS
- **Validação**: Zod
- **Autenticação**: JWT com cookies HTTP-only

### 1.3 Princípios Contábeis
O sistema implementa **Partidas Dobradas** (Double-Entry Bookkeeping):
- Toda transação gera pelo menos 2 lançamentos contábeis
- Débito = Crédito (sempre balanceado)
- Contas classificadas em: ATIVO, PASSIVO, RECEITA, DESPESA

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Estrutura de Pastas
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── trips/             # Página de viagens
│   └── shared/            # Página de compartilhadas
├── components/
│   ├── features/          # Componentes de funcionalidades
│   │   ├── shared-expenses/
│   │   └── trips/
│   ├── modals/            # Modais do sistema
│   │   └── transactions/
│   ├── ui/                # Componentes UI base
│   └── layout/            # Layouts
├── contexts/              # Context API
│   ├── unified-financial-context.tsx
│   └── period-context.tsx
├── lib/
│   ├── services/          # Serviços de negócio
│   ├── utils/             # Utilitários
│   └── validation/        # Schemas Zod
└── prisma/
    └── schema.prisma      # Schema do banco
```

### 2.2 Camadas da Aplicação
1. **Apresentação**: Componentes React
2. **Lógica de Negócio**: Services e Contexts
3. **Acesso a Dados**: Prisma ORM
4. **Banco de Dados**: SQLite


---

## 3. MODELO DE DADOS

### 3.1 Entidades Principais

#### User (Usuário)
```typescript
{
  id: string (CUID)
  email: string (único)
  name: string
  password: string (hash bcrypt)
  monthlyIncome?: Decimal
  preferences?: JSON
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Account (Conta Bancária)
```typescript
{
  id: string
  userId: string
  name: string
  type: 'ATIVO' | 'PASSIVO' | 'RECEITA' | 'DESPESA'
  balance: Decimal
  currency: string (default: 'BRL')
  isActive: boolean
  reconciledBalance: Decimal
  isInvestment: boolean
  allowNegativeBalance: boolean  // Cheque especial
  overdraftLimit: Decimal
  bankCode?: string
  bankName?: string
}
```

#### CreditCard (Cartão de Crédito)
```typescript
{
  id: string
  userId: string
  name: string
  limit: Decimal
  currentBalance: Decimal
  dueDay: number (1-31)
  closingDay: number (1-31)
  isActive: boolean
  interestRate?: Decimal
  brand?: string  // Visa, Mastercard, etc
  lastFourDigits?: string
  paymentAccountId?: string  // Conta para pagar fatura
}
```

#### Transaction (Transação)
```typescript
{
  id: string
  userId: string
  accountId?: string
  creditCardId?: string
  categoryId?: string
  amount: Decimal
  description: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  date: DateTime
  status: 'pending' | 'cleared' | 'reconciled' | 'cancelled'
  
  // Parcelamento
  isInstallment: boolean
  installmentNumber?: number
  totalInstallments?: number
  installmentGroupId?: string
  
  // Compartilhamento
  isShared: boolean
  sharedWith?: string (JSON array)
  totalSharedAmount?: Decimal
  myShare?: Decimal
  paidBy?: string  // ID de quem pagou
  
  // Viagem
  tripId?: string
  tripExpenseType?: 'shared' | 'regular' | 'trip'
  
  // Fatura
  invoiceId?: string
  
  // Metadados
  metadata?: string (JSON)
  deletedAt?: DateTime
}
```

#### Category (Categoria)
```typescript
{
  id: string
  userId: string
  name: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  parentId?: string  // Subcategorias
  color?: string
  icon?: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
}
```

#### Trip (Viagem)
```typescript
{
  id: string
  userId: string
  name: string
  destination: string
  description?: string
  startDate: DateTime
  endDate: DateTime
  budget: Decimal
  spent: Decimal  // Calculado automaticamente
  currency: string (default: 'BRL')
  status: 'planned' | 'active' | 'completed'
  participants?: string (JSON array)
}
```

#### SharedDebt (Dívida Compartilhada)
```typescript
{
  id: string
  userId: string
  creditorId: string  // Quem emprestou
  debtorId: string    // Quem deve
  originalAmount: Decimal
  currentAmount: Decimal
  paidAmount: Decimal
  description: string
  status: 'active' | 'paid' | 'cancelled'
  transactionId?: string
  tripId?: string
  paidAt?: DateTime
}
```

#### Invoice (Fatura de Cartão)
```typescript
{
  id: string
  creditCardId: string
  userId: string
  month: number (1-12)
  year: number
  totalAmount: Decimal
  paidAmount: Decimal
  dueDate: DateTime
  isPaid: boolean
  status: 'open' | 'partial' | 'paid' | 'overdue'
  paidAt?: DateTime
}
```

#### FamilyMember (Membro da Família)
```typescript
{
  id: string
  userId: string
  name: string
  relationship: string
  birthDate?: DateTime
  email?: string
  phone?: string
  isActive: boolean
}
```

### 3.2 Relacionamentos

```
User 1:N Account
User 1:N Transaction
User 1:N CreditCard
User 1:N Trip
User 1:N Category
User 1:N FamilyMember
User 1:N SharedDebt

Account 1:N Transaction
Account 1:N JournalEntry

CreditCard 1:N Transaction
CreditCard 1:N Invoice

Transaction N:1 Category
Transaction N:1 Trip
Transaction 1:N JournalEntry
Transaction 1:N SharedDebt

Trip 1:N Transaction
Trip 1:N Itinerary

Invoice 1:N Transaction
Invoice 1:N InvoicePayment
```


---

## 4. FUNCIONALIDADES PRINCIPAIS

### 4.1 Gestão de Transações

#### 4.1.1 Tipos de Transação
1. **RECEITA**: Entrada de dinheiro
   - Salário, freelance, vendas, etc
   - Aumenta saldo da conta
   - Partida dobrada: DÉBITO Conta, CRÉDITO Receita

2. **DESPESA**: Saída de dinheiro
   - Compras, contas, alimentação, etc
   - Diminui saldo da conta
   - Partida dobrada: DÉBITO Despesa, CRÉDITO Conta

3. **TRANSFERENCIA**: Movimentação entre contas
   - Não afeta patrimônio total
   - Partida dobrada: DÉBITO Conta Destino, CRÉDITO Conta Origem

#### 4.1.2 Características Especiais

**Parcelamento**:
- Divide valor em N parcelas
- Cria transações futuras automaticamente
- Agrupa por `installmentGroupId`
- Cada parcela tem `installmentNumber` e `totalInstallments`
- Pode ser em cartão de crédito ou conta

**Compartilhamento**:
- Divide despesa entre pessoas
- Métodos de divisão:
  - **Igual**: Divide igualmente entre todos
  - **Percentual**: Cada um paga uma porcentagem
  - **Valor fixo**: Cada um paga um valor específico
- Campos:
  - `isShared`: true
  - `sharedWith`: Array de IDs dos participantes
  - `totalSharedAmount`: Valor total
  - `myShare`: Minha parte

**Pago por Outra Pessoa**:
- Quando alguém paga por você
- Cria `SharedDebt` em vez de `Transaction`
- Não debita da sua conta
- Fica pendente até pagamento

### 4.2 Despesas Compartilhadas

#### 4.2.1 Fluxo Completo

**Cenário 1: EU paguei e quero dividir**
1. Criar transação normal
2. Marcar `isShared = true`
3. Selecionar pessoas em `sharedWith`
4. Sistema calcula `myShare` automaticamente
5. Debita da minha conta apenas `myShare`
6. Outras pessoas ficam devendo

**Cenário 2: OUTRA PESSOA pagou por mim**
1. Marcar "Pago por outra pessoa"
2. Selecionar quem pagou em `paidBy`
3. Sistema cria `SharedDebt` (não `Transaction`)
4. Não debita da minha conta
5. Fica registrado que EU devo

#### 4.2.2 Página de Compartilhadas

**Abas**:
1. **Despesas Regulares**: Compartilhadas do dia a dia
2. **Despesas de Viagem**: Compartilhadas em viagens

**Cards de Resumo**:
- Total Compartilhado (positivo = me devem, negativo = eu devo)
- Despesas Regulares
- Despesas de Viagem
- Pessoas Envolvidas

**Fatura por Pessoa**:
- Agrupa por contato
- Mostra itens que a pessoa me deve (CRÉDITO)
- Mostra itens que eu devo para a pessoa (DÉBITO)
- Calcula saldo líquido
- Botão "Pagar Tudo" ou "Marcar como Pago"

**Ações**:
- Editar transação compartilhada
- Marcar como paga
- Desmarcar pagamento
- Exportar fatura (CSV)

### 4.3 Gestão de Viagens

#### 4.3.1 Criação de Viagem

**Campos Obrigatórios**:
- Nome da viagem
- Destino
- Data início
- Data fim
- Orçamento
- Moeda (BRL, USD, EUR, etc)

**Campos Opcionais**:
- Descrição
- Participantes (membros da família)

**Status Automático**:
- `planned`: Antes da data início
- `active`: Entre data início e fim
- `completed`: Após data fim

#### 4.3.2 Controle de Gastos

**Cálculo Automático de `spent`**:
```typescript
spent = SUM(transactions WHERE tripId = trip.id)
```

**Considerações**:
- Apenas DESPESAS somam
- RECEITAS subtraem (reembolsos)
- Se compartilhada, usa `myShare`
- Atualiza em tempo real

**Progresso do Orçamento**:
```typescript
progress = (spent / budget) * 100
remaining = budget - spent
```

**Alertas**:
- Amarelo: 80% do orçamento
- Vermelho: 100% do orçamento
- Crítico: Acima do orçamento

#### 4.3.3 Funcionalidades da Viagem

**Itinerário**:
- Adicionar atividades por dia
- Horário, local, descrição
- Custo estimado
- Marcar como concluído

**Documentos**:
- Checklist de documentos
- Passaporte, visto, seguro, etc
- Progresso em %

**Participantes**:
- Adicionar/remover membros
- Apenas membros cadastrados em "Família"
- Organizador sempre incluído

**Conversão de Moeda**:
- Suporte a múltiplas moedas
- Taxa de câmbio manual
- Conversão automática para BRL

### 4.4 Cartões de Crédito e Faturas

#### 4.4.1 Ciclo de Fatura

**Datas Importantes**:
- `closingDay`: Dia de fechamento (ex: dia 10)
- `dueDay`: Dia de vencimento (ex: dia 20)

**Geração Automática**:
- Faturas criadas automaticamente todo mês
- Agrupa transações entre fechamento anterior e atual
- Calcula `totalAmount` automaticamente

**Status da Fatura**:
- `open`: Aberta, aceitando lançamentos
- `partial`: Parcialmente paga
- `paid`: Totalmente paga
- `overdue`: Vencida

#### 4.4.2 Pagamento de Fatura

**Opções**:
1. **Pagamento Total**: Paga valor total
2. **Pagamento Parcial**: Paga parte do valor
3. **Pagamento Mínimo**: Paga valor mínimo (com juros)

**Processo**:
1. Selecionar conta de pagamento
2. Informar valor
3. Sistema cria transação de DESPESA
4. Atualiza `paidAmount` da fatura
5. Se total, marca `isPaid = true`

### 4.5 Parcelamento

#### 4.5.1 Criação de Parcelamento

**Campos**:
- Valor total
- Número de parcelas
- Data primeira parcela
- Frequência (mensal, semanal)
- Conta ou cartão

**Processo**:
1. Cria transação "pai" com valor total
2. Gera N transações "filhas" (parcelas)
3. Cada parcela tem:
   - `installmentNumber`: 1, 2, 3...
   - `totalInstallments`: N
   - `installmentGroupId`: Mesmo ID para todas
   - `parentTransactionId`: ID da transação pai
4. Datas calculadas automaticamente

**Exemplo**:
```
Compra: R$ 1.200,00 em 12x
Parcela 1: R$ 100,00 - 01/01/2025
Parcela 2: R$ 100,00 - 01/02/2025
...
Parcela 12: R$ 100,00 - 01/12/2025
```

#### 4.5.2 Gestão de Parcelas

**Visualização**:
- Lista todas as parcelas
- Mostra status (paga, pendente)
- Progresso visual

**Ações**:
- Pagar parcela antecipadamente
- Cancelar parcelas futuras
- Editar valor (recalcula restantes)
- Deletar grupo inteiro

**Regras**:
- Não pode deletar parcela paga
- Deletar grupo deleta todas não pagas
- Editar recalcula saldo


---

## 5. FORMULÁRIOS E INTERFACES

### 5.1 Formulário de Nova Transação

#### 5.1.1 Campos Básicos

**Descrição** (obrigatório)
- Input text
- Máximo 500 caracteres
- Placeholder: "Ex: Supermercado Extra"

**Valor** (obrigatório)
- Input number
- Formato: R$ 0,00
- Aceita vírgula e ponto
- Validação: > 0

**Tipo** (obrigatório)
- Radio buttons
- Opções: Receita / Despesa
- Default: Despesa
- Muda cor do formulário

**Categoria** (obrigatório)
- Select dropdown
- Categorias por tipo
- Opção "Criar nova categoria"
- Suporte a subcategorias

**Conta/Cartão** (obrigatório)
- Select dropdown
- Separado por tipo:
  - 💰 Contas Bancárias
  - 💳 Cartões de Crédito
- Mostra saldo/limite disponível
- Receitas: apenas contas
- Despesas: contas ou cartões

**Data** (obrigatório)
- Date picker
- Formato: dd/mm/aaaa
- Default: hoje
- Validação de formato

**Observações** (opcional)
- Textarea
- Máximo 1000 caracteres
- Placeholder: "Notas adicionais..."

#### 5.1.2 Abas Avançadas

**Aba "Compartilhar"**

Checkbox: "Dividir esta despesa"
- Quando marcado, mostra opções

**Seleção de Pessoas**:
- Lista de membros da família
- Checkboxes múltiplos
- Avatar + Nome
- Sempre inclui "Você"

**Método de Divisão**:
1. **Igual**
   - Divide automaticamente
   - Mostra valor por pessoa
   - Não editável

2. **Percentual**
   - Slider ou input para cada pessoa
   - Total deve somar 100%
   - Validação em tempo real
   - Mostra valor calculado

3. **Valor Fixo**
   - Input de valor para cada pessoa
   - Total deve somar valor total
   - Validação em tempo real

**Resumo Visual**:
```
Total: R$ 100,00
Você: R$ 50,00 (50%)
João: R$ 30,00 (30%)
Maria: R$ 20,00 (20%)
```

**Opção "Pago por Outra Pessoa"**:
- Checkbox separado
- Select: Quem pagou?
- Quando marcado:
  - Não debita da sua conta
  - Cria dívida automaticamente
  - Mostra aviso: "Não será debitado da sua conta"

**Aba "Parcelar"**

Checkbox: "Parcelar esta compra"
- Quando marcado, mostra opções

**Número de Parcelas**:
- Input number
- Mínimo: 2
- Máximo: 48
- Mostra valor da parcela

**Data Primeira Parcela**:
- Date picker
- Default: próximo mês

**Frequência**:
- Select: Mensal / Semanal
- Default: Mensal

**Visualização**:
```
12x de R$ 100,00
Primeira: 01/02/2025
Última: 01/01/2026
Total: R$ 1.200,00
```

**Aba "Viagem"**

Checkbox: "Vincular a uma viagem"
- Quando marcado, mostra opções

**Selecionar Viagem**:
- Select dropdown
- Lista viagens ativas e planejadas
- Mostra: Nome - Destino - Datas

**Tipo de Despesa**:
- Radio buttons
- Opções:
  - Regular: Despesa normal da viagem
  - Compartilhada: Dividida com participantes
  - Viagem: Específica da viagem

**Conversão de Moeda**:
- Mostra se viagem tem moeda diferente
- Input: Valor na moeda da viagem
- Input: Taxa de câmbio
- Calcula automaticamente em BRL

**Progresso do Orçamento**:
- Barra de progresso
- Mostra quanto já gastou
- Alerta se próximo do limite

#### 5.1.3 Validações

**Antes de Salvar**:
1. Todos campos obrigatórios preenchidos
2. Valor > 0
3. Data válida
4. Conta/cartão selecionado
5. Se compartilhado:
   - Pelo menos 1 pessoa selecionada
   - Divisão soma 100% ou valor total
6. Se parcelado:
   - Número de parcelas >= 2
   - Data primeira parcela válida
7. Se cartão:
   - Limite disponível suficiente

**Mensagens de Erro**:
- Toast vermelho no topo
- Destaca campo com erro
- Mensagem clara e específica

### 5.2 Página de Despesas Compartilhadas

#### 5.2.1 Layout Geral

**Header**:
- Título: "Despesas Compartilhadas"
- Botão: "Nova Despesa Compartilhada"
- Filtros: Período, Pessoa, Status

**Cards de Resumo** (4 cards):

1. **Total Compartilhado**
   - Valor líquido (positivo ou negativo)
   - Verde se positivo (me devem)
   - Vermelho se negativo (eu devo)
   - Contador de transações

2. **Despesas Regulares**
   - Total de despesas regulares
   - Contador de transações
   - Verde/vermelho conforme saldo

3. **Despesas de Viagem**
   - Total de despesas de viagem
   - Contador de transações
   - Roxo para viagens

4. **Pessoas Envolvidas**
   - Número de pessoas
   - Ícone de usuários
   - Laranja

**Abas**:
1. Despesas Regulares
2. Despesas de Viagem

#### 5.2.2 Fatura por Pessoa

**Card de Fatura**:
```
┌─────────────────────────────────────┐
│ 👤 João Silva                       │
│                                     │
│ Saldo: R$ 150,00 (João me deve)    │
│                                     │
│ ✅ Itens que João me deve:         │
│   • Supermercado - R$ 100,00       │
│   • Cinema - R$ 50,00              │
│                                     │
│ ❌ Itens que eu devo para João:    │
│   • Nenhum                         │
│                                     │
│ [Pagar Tudo] [Exportar]            │
└─────────────────────────────────────┘
```

**Detalhes do Item**:
- Descrição
- Data
- Categoria
- Valor
- Status (pago/pendente)
- Ações: Editar, Marcar como pago

**Modal de Pagamento**:
1. Selecionar conta
2. Selecionar data
3. Confirmar valor
4. Observações
5. Botão "Confirmar Pagamento"

**Processo de Pagamento**:
1. Cria transação de RECEITA (se me devem)
2. Cria transação de DESPESA (se eu devo)
3. Marca itens como pagos
4. Atualiza SharedDebt
5. Mostra toast de sucesso

### 5.3 Página de Viagens

#### 5.3.1 Lista de Viagens

**Card de Viagem**:
```
┌─────────────────────────────────────┐
│ ✈️ Férias em Paris                  │
│ 📍 Paris, França                    │
│ 📅 01/07/2025 - 15/07/2025         │
│ 👥 3 participantes                  │
│                                     │
│ Orçamento: € 5.000,00              │
│ Gasto: € 3.200,00 (64%)            │
│ [████████░░] 64%                   │
│                                     │
│ Status: Planejada                   │
│ Faltam 45 dias                     │
│                                     │
│ [Editar] [Ver Detalhes]            │
└─────────────────────────────────────┘
```

**Filtros**:
- Todas
- Planejadas
- Em Andamento
- Concluídas

**Estatísticas Gerais**:
- Total de viagens
- Total gasto
- Orçamento total
- Utilização média

#### 5.3.2 Detalhes da Viagem

**Header da Viagem**:
- Fundo azul gradiente
- Nome grande
- Destino
- Datas
- Status badge
- Botão "Editar Viagem"
- Contador de dias (se planejada)

**Cards de Estatísticas** (4 cards):
1. Meu Gasto Individual
2. Documentos (% completo)
3. Checklist (% completo)
4. Roteiro (número de itens)

**Progresso do Orçamento**:
- Barra de progresso grande
- Valor gasto / Orçamento
- Percentual
- Valor restante
- Alerta se excedeu

**Seção de Participantes**:
- Avatar de cada participante
- Nome
- Badge "Organizador" para você
- Botão "Gerenciar Participantes"

**Modal de Participantes**:
- Lista de membros da família
- Checkboxes
- "Você" sempre incluído
- Aviso: "Devem estar cadastrados em Família"
- Botão "Salvar"

**Seção de Itinerário**:
- Lista de atividades por dia
- Horário, local, descrição
- Custo
- Checkbox "Concluído"
- Botão "Adicionar Atividade"

**Seção de Despesas**:
- Lista de transações da viagem
- Filtros: Todas, Minhas, Compartilhadas
- Botão "Nova Despesa"
- Abre modal de transação com viagem pré-selecionada

### 5.4 Modal de Edição de Viagem

**Campos**:
- Nome da viagem *
- Destino *
- Data início *
- Data fim *
- Orçamento *
- Moeda
- Descrição
- Status (planned/active/completed)

**Validações**:
- Data fim >= Data início
- Orçamento > 0
- Nome e destino obrigatórios

**Botões**:
- Cancelar
- Salvar
- Deletar (com confirmação)


---

## 6. FLUXOS DE NEGÓCIO

### 6.1 Fluxo: Criar Despesa Compartilhada (EU paguei)

```
1. Usuário clica "Nova Transação"
2. Preenche dados básicos:
   - Descrição: "Jantar no restaurante"
   - Valor: R$ 200,00
   - Tipo: Despesa
   - Categoria: Alimentação
   - Conta: Nubank
   - Data: Hoje

3. Vai para aba "Compartilhar"
4. Marca "Dividir esta despesa"
5. Seleciona pessoas:
   ☑ Você
   ☑ João
   ☑ Maria

6. Escolhe método: "Igual"
   Sistema calcula:
   - Você: R$ 66,67
   - João: R$ 66,67
   - Maria: R$ 66,66

7. Clica "Salvar"

BACKEND:
8. Valida dados
9. Cria Transaction:
   - amount: 200.00
   - type: DESPESA
   - accountId: nubank_id
   - isShared: true
   - sharedWith: ["joao_id", "maria_id"]
   - myShare: 66.67
   - totalSharedAmount: 200.00

10. Cria JournalEntry (Partidas Dobradas):
    - DÉBITO: Despesa Alimentação - R$ 66,67
    - CRÉDITO: Conta Nubank - R$ 66,67

11. Atualiza saldo da conta:
    - Nubank: -66,67 (apenas minha parte)

12. Cria SharedDebt para cada pessoa:
    - João deve R$ 66,67
    - Maria deve R$ 66,66

13. Retorna sucesso

FRONTEND:
14. Mostra toast: "Despesa compartilhada criada!"
15. Atualiza lista de transações
16. Atualiza saldo da conta
17. Fecha modal
```

### 6.2 Fluxo: Criar Despesa Paga por Outra Pessoa

```
1. Usuário clica "Nova Transação"
2. Preenche dados básicos:
   - Descrição: "Uber para casa"
   - Valor: R$ 30,00
   - Tipo: Despesa
   - Categoria: Transporte

3. Vai para aba "Compartilhar"
4. Marca "Pago por outra pessoa"
5. Seleciona: João
6. Sistema mostra aviso:
   "⚠️ Esta despesa não será debitada da sua conta"

7. Clica "Salvar"

BACKEND:
8. Valida dados
9. NÃO cria Transaction
10. Cria SharedDebt:
    - userId: user_id
    - creditorId: joao_id (quem pagou)
    - debtorId: user_id (quem deve)
    - originalAmount: 30.00
    - currentAmount: 30.00
    - description: "Uber para casa (Transporte)"
    - status: active

11. NÃO atualiza saldo de nenhuma conta
12. Retorna sucesso

FRONTEND:
13. Mostra toast: "Dívida registrada!"
14. Atualiza lista de dívidas
15. Fecha modal
```

### 6.3 Fluxo: Pagar Fatura de Despesas Compartilhadas

```
1. Usuário vai em "Compartilhadas"
2. Vê fatura de João:
   - João me deve: R$ 150,00
   - Eu devo para João: R$ 30,00
   - Saldo: R$ 120,00 (João me deve)

3. Clica "Pagar Tudo"
4. Modal abre:
   - Valor: R$ 120,00 (não editável)
   - Conta: [Selecionar]
   - Data: Hoje
   - Observações: [opcional]

5. Seleciona conta: Nubank
6. Clica "Confirmar Pagamento"

BACKEND:
7. Valida dados
8. Para cada item que João me deve:
   a. Cria Transaction de RECEITA:
      - amount: valor_item
      - type: RECEITA
      - accountId: nubank_id
      - description: "Recebimento - [descrição] (João)"
      - metadata: { type: 'shared_expense_payment', ... }
   
   b. Cria JournalEntry:
      - DÉBITO: Conta Nubank
      - CRÉDITO: Receita

   c. Atualiza saldo:
      - Nubank: +valor_item

9. Para cada item que eu devo para João:
   a. Cria Transaction de DESPESA:
      - amount: valor_item
      - type: DESPESA
      - accountId: nubank_id
      - description: "Pagamento - [descrição] (para João)"
   
   b. Cria JournalEntry:
      - DÉBITO: Despesa
      - CRÉDITO: Conta Nubank
   
   c. Atualiza saldo:
      - Nubank: -valor_item

10. Marca SharedDebts como paid:
    - status: paid
    - paidAt: now()

11. Retorna sucesso

FRONTEND:
12. Mostra toast: "Pagamento registrado!"
13. Atualiza lista de compartilhadas
14. Atualiza saldo da conta
15. Remove itens pagos da fatura
16. Fecha modal
```

### 6.4 Fluxo: Criar Viagem

```
1. Usuário clica "Nova Viagem"
2. Preenche formulário:
   - Nome: "Férias em Paris"
   - Destino: "Paris, França"
   - Data início: 01/07/2025
   - Data fim: 15/07/2025
   - Orçamento: 5000
   - Moeda: EUR
   - Descrição: "Viagem de férias..."

3. Clica "Salvar"

BACKEND:
4. Valida dados:
   - Data fim >= Data início ✓
   - Orçamento > 0 ✓
   - Nome e destino preenchidos ✓

5. Calcula status automático:
   - Hoje < Data início → planned
   - Hoje entre datas → active
   - Hoje > Data fim → completed

6. Cria Trip:
   - name: "Férias em Paris"
   - destination: "Paris, França"
   - startDate: 2025-07-01
   - endDate: 2025-07-15
   - budget: 5000
   - currency: EUR
   - status: planned
   - spent: 0
   - participants: ["Você"]

7. Retorna trip criada

FRONTEND:
8. Mostra toast: "Viagem criada!"
9. Redireciona para detalhes da viagem
10. Mostra contador de dias
```

### 6.5 Fluxo: Adicionar Despesa em Viagem

```
1. Usuário está em detalhes da viagem
2. Clica "Nova Despesa"
3. Modal abre com viagem pré-selecionada
4. Preenche:
   - Descrição: "Hotel"
   - Valor: 500 (em EUR)
   - Categoria: Hospedagem
   - Conta: Nubank

5. Sistema detecta moeda diferente
6. Mostra conversor:
   - Valor original: € 500,00
   - Taxa: 6,00
   - Valor em BRL: R$ 3.000,00

7. Pode marcar como compartilhada
8. Clica "Salvar"

BACKEND:
9. Cria Transaction:
   - amount: 3000.00 (em BRL)
   - tripId: trip_id
   - currency: EUR
   - originalAmount: 500.00
   - exchangeRate: 6.00
   - metadata: { originalCurrency: 'EUR', ... }

10. Cria JournalEntry
11. Atualiza saldo da conta: -3000.00
12. Recalcula spent da viagem:
    - spent = SUM(transactions WHERE tripId)
    - spent = 3000.00

13. Retorna sucesso

FRONTEND:
14. Mostra toast: "Despesa adicionada!"
15. Atualiza lista de despesas
16. Atualiza progresso do orçamento
17. Atualiza valor gasto
18. Fecha modal
```

### 6.6 Fluxo: Parcelar Compra

```
1. Usuário clica "Nova Transação"
2. Preenche:
   - Descrição: "Notebook"
   - Valor: R$ 3.600,00
   - Categoria: Eletrônicos
   - Cartão: Nubank

3. Vai para aba "Parcelar"
4. Marca "Parcelar esta compra"
5. Preenche:
   - Parcelas: 12
   - Primeira parcela: 01/02/2025
   - Frequência: Mensal

6. Sistema mostra:
   "12x de R$ 300,00"

7. Clica "Salvar"

BACKEND:
8. Gera installmentGroupId único
9. Cria transação PAI:
   - amount: 3600.00
   - isInstallment: true
   - totalInstallments: 12
   - installmentGroupId: group_id

10. Para cada parcela (1 a 12):
    a. Calcula data: 01/02, 01/03, ..., 01/01/2026
    b. Cria Transaction:
       - amount: 300.00
       - installmentNumber: N
       - totalInstallments: 12
       - installmentGroupId: group_id
       - parentTransactionId: pai_id
       - date: data_calculada
       - creditCardId: nubank_id

11. Cria JournalEntry para cada parcela
12. Adiciona à fatura correspondente
13. Retorna sucesso

FRONTEND:
14. Mostra toast: "Compra parcelada em 12x!"
15. Mostra lista de parcelas
16. Atualiza limite do cartão
17. Fecha modal
```

### 6.7 Fluxo: Pagar Fatura de Cartão

```
1. Usuário vai em "Cartões"
2. Vê fatura de Janeiro/2025:
   - Total: R$ 1.500,00
   - Vencimento: 20/01/2025
   - Status: Aberta

3. Clica "Pagar Fatura"
4. Modal abre:
   - Valor total: R$ 1.500,00
   - Valor mínimo: R$ 150,00
   - Valor a pagar: [editável]
   - Conta: [selecionar]
   - Data: Hoje

5. Seleciona:
   - Valor: R$ 1.500,00 (total)
   - Conta: Nubank

6. Clica "Confirmar Pagamento"

BACKEND:
7. Valida:
   - Conta tem saldo suficiente
   - Valor > 0
   - Valor <= total da fatura

8. Cria Transaction de DESPESA:
   - amount: 1500.00
   - type: DESPESA
   - accountId: nubank_id
   - description: "Pagamento Fatura Cartão - Jan/2025"
   - categoryId: categoria_cartao

9. Cria InvoicePayment:
   - invoiceId: invoice_id
   - accountId: nubank_id
   - amount: 1500.00
   - paymentDate: today

10. Atualiza Invoice:
    - paidAmount: 1500.00
    - isPaid: true (se total)
    - status: paid
    - paidAt: now()

11. Cria JournalEntry:
    - DÉBITO: Despesa Cartão
    - CRÉDITO: Conta Nubank

12. Atualiza saldo:
    - Nubank: -1500.00

13. Libera limite do cartão:
    - currentBalance: -1500.00

14. Retorna sucesso

FRONTEND:
15. Mostra toast: "Fatura paga!"
16. Atualiza status da fatura
17. Atualiza saldo da conta
18. Atualiza limite do cartão
19. Fecha modal
```


---

## 7. APIs E INTEGRAÇÕES

### 7.1 Endpoints da API

#### 7.1.1 Transações

**POST /api/transactions**
```typescript
Request:
{
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  accountId?: string
  creditCardId?: string
  categoryId?: string
  date: string (YYYY-MM-DD)
  status: 'pending' | 'cleared' | 'reconciled'
  
  // Parcelamento
  installments?: number
  
  // Compartilhamento
  isShared?: boolean
  sharedWith?: string[]
  
  // Pago por outra pessoa
  paidBy?: string
  
  // Viagem
  tripId?: string
}

Response:
{
  success: boolean
  transaction?: Transaction
  installments?: Transaction[]  // Se parcelado
  debt?: SharedDebt  // Se pago por outra pessoa
  message?: string
  error?: string
}
```

**GET /api/transactions**
```typescript
Query Params:
- page?: number
- limit?: number
- tripId?: string
- accountId?: string
- startDate?: string
- endDate?: string

Response:
{
  success: boolean
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}
```

**PUT /api/transactions/:id**
```typescript
Request:
{
  description?: string
  amount?: number
  categoryId?: string
  date?: string
  // ... outros campos editáveis
}

Response:
{
  success: boolean
  transaction: Transaction
}
```

**DELETE /api/transactions/:id**
```typescript
Response:
{
  success: boolean
  message: string
}

Regras:
- Soft delete (deletedAt)
- Reverte partidas dobradas
- Atualiza saldo da conta
- Se parcelada, pode deletar grupo inteiro
```

#### 7.1.2 Viagens

**POST /api/trips**
```typescript
Request:
{
  name: string
  destination: string
  startDate: string
  endDate: string
  budget: number
  currency: string
  description?: string
  participants?: string[]
}

Response:
{
  success: boolean
  trip: Trip
}
```

**GET /api/trips**
```typescript
Response:
{
  success: boolean
  trips: Trip[]
}
```

**PUT /api/trips/:id**
```typescript
Request:
{
  name?: string
  destination?: string
  startDate?: string
  endDate?: string
  budget?: number
  currency?: string
  description?: string
  participants?: string[]
  status?: 'planned' | 'active' | 'completed'
}

Response:
{
  success: boolean
  trip: Trip
}
```

**POST /api/trips/:id/link-transactions**
```typescript
Request:
{
  transactionIds: string[]
}

Response:
{
  success: boolean
  linkedCount: number
}

Função:
- Vincula transações existentes à viagem
- Atualiza spent automaticamente
```

#### 7.1.3 Dívidas Compartilhadas

**GET /api/debts**
```typescript
Query Params:
- status?: 'active' | 'paid' | 'cancelled'
- contactId?: string

Response:
{
  success: boolean
  debts: SharedDebt[]
}
```

**PUT /api/debts/:id**
```typescript
Request:
{
  status?: 'active' | 'paid' | 'cancelled'
  paidAt?: string
}

Response:
{
  success: boolean
  debt: SharedDebt
}
```

#### 7.1.4 Cartões e Faturas

**GET /api/credit-cards**
```typescript
Response:
{
  success: boolean
  creditCards: CreditCard[]
}
```

**GET /api/invoices**
```typescript
Query Params:
- creditCardId?: string
- month?: number
- year?: number
- status?: 'open' | 'partial' | 'paid' | 'overdue'

Response:
{
  success: boolean
  invoices: Invoice[]
}
```

**POST /api/invoices/:id/pay**
```typescript
Request:
{
  accountId: string
  amount: number
  paymentDate: string
}

Response:
{
  success: boolean
  payment: InvoicePayment
  invoice: Invoice
}
```

#### 7.1.5 Membros da Família

**GET /api/family-members**
```typescript
Response:
{
  success: boolean
  members: FamilyMember[]
}
```

**POST /api/family-members**
```typescript
Request:
{
  name: string
  relationship: string
  birthDate?: string
  email?: string
  phone?: string
}

Response:
{
  success: boolean
  member: FamilyMember
}
```

#### 7.1.6 Categorias

**GET /api/categories**
```typescript
Response:
{
  success: boolean
  categories: Category[]
}
```

**POST /api/categories**
```typescript
Request:
{
  name: string
  type: 'RECEITA' | 'DESPESA'
  parentId?: string
  color?: string
  icon?: string
}

Response:
{
  success: boolean
  category: Category
}
```

### 7.2 Serviços de Negócio

#### 7.2.1 FinancialOperationsService

**Responsabilidades**:
- Criar transações com partidas dobradas
- Validar saldo antes de criar despesa
- Validar limite de cartão
- Criar parcelamentos
- Processar transferências

**Métodos Principais**:

```typescript
class FinancialOperationsService {
  // Criar transação única
  static async createTransaction(params: {
    transaction: TransactionInput
    createJournalEntries: boolean
    linkToInvoice: boolean
  }): Promise<Transaction>

  // Criar parcelamento
  static async createInstallments(params: {
    baseTransaction: TransactionInput
    totalInstallments: number
    firstDueDate: Date
    frequency: 'monthly' | 'weekly'
  }): Promise<{
    parentTransaction: Transaction
    installments: Transaction[]
  }>

  // Criar transferência
  static async createTransfer(params: {
    fromAccountId: string
    toAccountId: string
    amount: number
    description: string
    date: Date
  }): Promise<{
    debitTransaction: Transaction
    creditTransaction: Transaction
  }>

  // Deletar transação
  static async deleteTransaction(
    transactionId: string
  ): Promise<void>

  // Atualizar saldo da conta
  static async updateAccountBalance(
    accountId: string
  ): Promise<Account>
}
```

#### 7.2.2 InvoiceCalculator

**Responsabilidades**:
- Calcular total da fatura
- Agrupar transações por período
- Calcular juros se pagamento parcial
- Gerar faturas automaticamente

**Métodos Principais**:

```typescript
class InvoiceCalculator {
  // Calcular total da fatura
  static calculateInvoiceTotal(
    transactions: Transaction[]
  ): number

  // Gerar fatura do mês
  static async generateMonthlyInvoice(
    creditCardId: string,
    month: number,
    year: number
  ): Promise<Invoice>

  // Calcular período da fatura
  static calculateInvoicePeriod(
    closingDay: number,
    month: number,
    year: number
  ): {
    startDate: Date
    endDate: Date
  }

  // Calcular juros
  static calculateInterest(
    totalAmount: number,
    paidAmount: number,
    interestRate: number
  ): number
}
```

### 7.3 Context API

#### 7.3.1 UnifiedFinancialContext

**Responsabilidades**:
- Centralizar dados financeiros
- Gerenciar estado global
- Sincronizar com API
- Calcular totais e agregações

**Estado**:
```typescript
{
  // Dados
  accounts: Account[]
  transactions: Transaction[]
  creditCards: CreditCard[]
  trips: Trip[]
  categories: Category[]
  contacts: FamilyMember[]
  debts: SharedDebt[]
  
  // Loading
  loading: boolean
  error: string | null
  
  // Actions
  actions: {
    refreshData: () => Promise<void>
    createTransaction: (data) => Promise<void>
    updateTransaction: (id, data) => Promise<void>
    deleteTransaction: (id) => Promise<void>
    createTrip: (data) => Promise<void>
    updateTrip: (id, data) => Promise<void>
    // ... outras ações
  }
}
```

**Hooks Derivados**:
```typescript
// Usar apenas contas
const { accounts } = useAccounts()

// Usar apenas transações
const { transactions } = useTransactions()

// Usar apenas viagens
const { trips } = useTrips()

// Usar apenas contatos
const { contacts } = useContacts()
```

#### 7.3.2 PeriodContext

**Responsabilidades**:
- Gerenciar período selecionado
- Filtrar dados por período
- Calcular datas de início/fim

**Estado**:
```typescript
{
  selectedMonth: number
  selectedYear: number
  
  getPeriodDates: () => {
    startDate: Date
    endDate: Date
  }
  
  setMonth: (month: number) => void
  setYear: (year: number) => void
  nextMonth: () => void
  previousMonth: () => void
}
```

### 7.4 Validação com Zod

#### 7.4.1 TransactionSchema

```typescript
const TransactionSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  accountId: z.string().cuid().optional(),
  creditCardId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  amount: z.number().or(z.string().transform(Number)),
  description: z.string().min(1).max(500),
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  date: z.string().or(z.date()).transform(val =>
    typeof val === 'string' ? new Date(val) : val
  ),
  status: z.enum(['pending', 'cleared', 'reconciled', 'cancelled']).default('cleared'),
  
  // Parcelamento
  isInstallment: z.boolean().default(false),
  installmentNumber: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
  
  // Compartilhamento
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).or(z.string()).optional(),
  totalSharedAmount: z.number().optional(),
  myShare: z.number().optional(),
  paidBy: z.string().optional(),
  
  // Viagem
  tripId: z.string().cuid().optional(),
  
  // Metadados
  metadata: z.string().optional(),
}).refine(
  (data) => {
    // Se paidBy, não precisa de accountId/creditCardId
    if (data.paidBy) return true
    // Caso contrário, deve ter um dos dois
    return data.accountId || data.creditCardId
  },
  {
    message: 'Transação deve ter accountId OU creditCardId',
    path: ['accountId'],
  }
).refine(
  (data) => {
    // Se parcelamento, deve ter número e total
    if (data.isInstallment) {
      return data.installmentNumber && data.totalInstallments
    }
    return true
  },
  {
    message: 'Parcelamento deve ter installmentNumber e totalInstallments',
    path: ['isInstallment'],
  }
)
```

#### 7.4.2 TripSchema

```typescript
const TripSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  name: z.string().min(1).max(100),
  destination: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().or(z.date()).transform(val =>
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.string().or(z.date()).transform(val =>
    typeof val === 'string' ? new Date(val) : val
  ),
  budget: z.number().or(z.string().transform(Number)).default(0),
  spent: z.number().or(z.string().transform(Number)).default(0),
  currency: z.string().default('BRL'),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  participants: z.array(z.string()).or(z.string()).optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'Data final deve ser maior ou igual à data inicial',
    path: ['endDate'],
  }
)
```


---

## 8. REGRAS DE NEGÓCIO

### 8.1 Partidas Dobradas (Double-Entry Bookkeeping)

#### 8.1.1 Princípio Fundamental
Toda transação financeira afeta pelo menos 2 contas:
- Uma conta é DEBITADA
- Outra conta é CREDITADA
- Débito Total = Crédito Total (sempre)

#### 8.1.2 Tipos de Conta

**ATIVO** (Bens e Direitos):
- Contas bancárias
- Investimentos
- Contas a receber
- Débito aumenta, Crédito diminui

**PASSIVO** (Obrigações):
- Cartões de crédito
- Empréstimos
- Contas a pagar
- Débito diminui, Crédito aumenta

**RECEITA** (Ganhos):
- Salário
- Vendas
- Rendimentos
- Débito diminui, Crédito aumenta

**DESPESA** (Gastos):
- Alimentação
- Transporte
- Moradia
- Débito aumenta, Crédito diminui

#### 8.1.3 Lançamentos por Tipo de Transação

**RECEITA (Entrada de dinheiro)**:
```
Exemplo: Salário de R$ 5.000,00

Lançamentos:
1. DÉBITO: Conta Bancária (ATIVO) - R$ 5.000,00
2. CRÉDITO: Receita Salário (RECEITA) - R$ 5.000,00

Efeito:
- Saldo da conta aumenta
- Receita do período aumenta
```

**DESPESA (Saída de dinheiro)**:
```
Exemplo: Supermercado R$ 300,00

Lançamentos:
1. DÉBITO: Despesa Alimentação (DESPESA) - R$ 300,00
2. CRÉDITO: Conta Bancária (ATIVO) - R$ 300,00

Efeito:
- Saldo da conta diminui
- Despesa do período aumenta
```

**DESPESA NO CARTÃO**:
```
Exemplo: Restaurante R$ 150,00 no cartão

Lançamentos:
1. DÉBITO: Despesa Alimentação (DESPESA) - R$ 150,00
2. CRÉDITO: Cartão de Crédito (PASSIVO) - R$ 150,00

Efeito:
- Saldo do cartão aumenta (dívida)
- Limite disponível diminui
- Despesa do período aumenta
```

**PAGAMENTO DE FATURA**:
```
Exemplo: Pagar fatura de R$ 1.500,00

Lançamentos:
1. DÉBITO: Cartão de Crédito (PASSIVO) - R$ 1.500,00
2. CRÉDITO: Conta Bancária (ATIVO) - R$ 1.500,00

Efeito:
- Saldo da conta diminui
- Saldo do cartão diminui (dívida)
- Limite disponível aumenta
```

**TRANSFERÊNCIA ENTRE CONTAS**:
```
Exemplo: Transferir R$ 1.000,00 de Nubank para Itaú

Lançamentos:
1. DÉBITO: Conta Itaú (ATIVO) - R$ 1.000,00
2. CRÉDITO: Conta Nubank (ATIVO) - R$ 1.000,00

Efeito:
- Saldo Nubank diminui
- Saldo Itaú aumenta
- Patrimônio total não muda
```

### 8.2 Despesas Compartilhadas

#### 8.2.1 Regra: EU Paguei

Quando EU pago uma despesa compartilhada:
1. Debita da minha conta apenas MINHA PARTE
2. Outras pessoas ficam me devendo
3. Cria SharedDebt para cada pessoa

**Exemplo**:
```
Jantar de R$ 300,00 dividido entre 3 pessoas:
- Eu: R$ 100,00
- João: R$ 100,00
- Maria: R$ 100,00

Lançamentos:
1. DÉBITO: Despesa Alimentação - R$ 100,00
2. CRÉDITO: Minha Conta - R$ 100,00

SharedDebts criadas:
- João me deve R$ 100,00
- Maria me deve R$ 100,00

Saldo da minha conta: -R$ 100,00 (não -R$ 300,00!)
```

#### 8.2.2 Regra: OUTRA PESSOA Pagou

Quando outra pessoa paga por mim:
1. NÃO debita da minha conta
2. Cria SharedDebt (EU devo)
3. NÃO cria Transaction

**Exemplo**:
```
João pagou Uber de R$ 30,00 por mim

NÃO há lançamentos contábeis
Apenas cria:
- SharedDebt: Eu devo R$ 30,00 para João

Saldo da minha conta: não muda
```

#### 8.2.3 Regra: Pagamento de Dívida

Quando pago uma dívida compartilhada:
1. Se EU devo: Cria DESPESA
2. Se ME devem: Cria RECEITA
3. Marca SharedDebt como paga

**Exemplo 1: Pagar o que devo**:
```
Pagar R$ 30,00 que devo para João

Lançamentos:
1. DÉBITO: Despesa Compartilhada - R$ 30,00
2. CRÉDITO: Minha Conta - R$ 30,00

SharedDebt atualizada:
- status: paid
- paidAt: now()

Saldo da minha conta: -R$ 30,00
```

**Exemplo 2: Receber o que me devem**:
```
João me paga R$ 100,00 que devia

Lançamentos:
1. DÉBITO: Minha Conta - R$ 100,00
2. CRÉDITO: Receita Compartilhada - R$ 100,00

SharedDebt atualizada:
- status: paid
- paidAt: now()

Saldo da minha conta: +R$ 100,00
```

### 8.3 Viagens

#### 8.3.1 Regra: Cálculo de Gasto

O campo `spent` da viagem é calculado automaticamente:

```typescript
spent = SUM(
  transactions
  WHERE tripId = trip.id
  AND deletedAt IS NULL
)

Considerações:
- DESPESA: soma positivo
- RECEITA: soma negativo (reembolso)
- Se isShared: usa myShare em vez de amount
- Atualiza em tempo real
```

**Exemplo**:
```
Viagem com orçamento de R$ 5.000,00

Transações:
1. Hotel: R$ 2.000,00 (DESPESA)
2. Alimentação: R$ 800,00 (DESPESA, compartilhada, myShare: R$ 400,00)
3. Reembolso: R$ 200,00 (RECEITA)

Cálculo:
spent = 2000 + 400 - 200 = R$ 2.200,00

Progresso: 44% (2200 / 5000)
Restante: R$ 2.800,00
```

#### 8.3.2 Regra: Status Automático

O status da viagem é calculado automaticamente:

```typescript
const now = new Date()
const start = new Date(trip.startDate)
const end = new Date(trip.endDate)

if (now < start) {
  status = 'planned'
} else if (now >= start && now <= end) {
  status = 'active'
} else {
  status = 'completed'
}
```

#### 8.3.3 Regra: Participantes

- Sempre inclui "Você" (organizador)
- Outros participantes devem estar em FamilyMembers
- Usado para despesas compartilhadas da viagem
- Pode ser editado a qualquer momento

### 8.4 Parcelamento

#### 8.4.1 Regra: Criação de Parcelas

Ao parcelar uma compra:
1. Cria transação PAI com valor total
2. Gera N transações FILHAS (parcelas)
3. Todas têm mesmo `installmentGroupId`
4. Cada parcela tem `installmentNumber` sequencial

**Exemplo**:
```
Notebook R$ 3.600,00 em 12x

Transação PAI:
- id: parent_id
- amount: 3600.00
- isInstallment: true
- totalInstallments: 12
- installmentGroupId: group_123

Parcelas (1 a 12):
- id: parcela_1_id
- amount: 300.00
- installmentNumber: 1
- totalInstallments: 12
- installmentGroupId: group_123
- parentTransactionId: parent_id
- date: 01/02/2025

... (repetir para 2 a 12)
```

#### 8.4.2 Regra: Deleção de Parcelamento

Ao deletar uma parcela:
- Se parcela JÁ PAGA: Não pode deletar
- Se parcela FUTURA: Pode deletar
- Opção: Deletar TODAS as parcelas futuras

**Exemplo**:
```
Parcelamento de 12x, já pagou 3:

Parcelas 1-3: PAGAS (não pode deletar)
Parcelas 4-12: FUTURAS (pode deletar)

Ao deletar parcela 4:
- Opção 1: Deletar apenas parcela 4
- Opção 2: Deletar parcelas 4 a 12 (cancelar parcelamento)
```

#### 8.4.3 Regra: Edição de Parcela

Ao editar valor de uma parcela:
- Recalcula parcelas restantes
- Mantém total do parcelamento
- Não afeta parcelas já pagas

**Exemplo**:
```
Parcelamento de R$ 1.200,00 em 12x de R$ 100,00
Já pagou 3 parcelas

Edita parcela 4 para R$ 150,00:
- Parcelas 1-3: R$ 100,00 (pagas, não mudam)
- Parcela 4: R$ 150,00 (editada)
- Parcelas 5-12: Recalculadas

Novo cálculo:
Total: R$ 1.200,00
Pago: R$ 300,00 (3x R$ 100,00)
Restante: R$ 900,00
Parcela 4: R$ 150,00
Restante após 4: R$ 750,00
Parcelas 5-12: R$ 750,00 / 8 = R$ 93,75
```

### 8.5 Cartões de Crédito

#### 8.5.1 Regra: Limite Disponível

```typescript
limiteDisponivel = limite - currentBalance

Onde:
- limite: Limite total do cartão
- currentBalance: Soma de todas as despesas não pagas
```

**Exemplo**:
```
Cartão com limite de R$ 5.000,00
Despesas do mês: R$ 2.300,00

Limite disponível: R$ 5.000,00 - R$ 2.300,00 = R$ 2.700,00
```

#### 8.5.2 Regra: Validação de Compra

Antes de criar despesa no cartão:
1. Verifica se tem limite disponível
2. Se não tem, rejeita transação
3. Exceção: Se `allowOverLimit = true` e dentro do percentual

**Exemplo**:
```
Limite: R$ 5.000,00
Usado: R$ 4.800,00
Disponível: R$ 200,00

Tentativa de compra: R$ 500,00
Resultado: REJEITADO (limite insuficiente)

Se allowOverLimit = true e overLimitPercent = 10%:
Limite máximo: R$ 5.500,00 (5000 + 10%)
Resultado: APROVADO
```

#### 8.5.3 Regra: Geração de Fatura

Faturas são geradas automaticamente:
1. Todo mês no dia de fechamento
2. Agrupa transações do período
3. Calcula total automaticamente

**Exemplo**:
```
Cartão com fechamento dia 10 e vencimento dia 20

Fatura de Janeiro/2025:
- Período: 11/12/2024 a 10/01/2025
- Vencimento: 20/01/2025
- Transações: Todas do período
- Total: Soma automática
```

#### 8.5.4 Regra: Pagamento de Fatura

Ao pagar fatura:
1. Valida saldo da conta
2. Cria transação de DESPESA
3. Atualiza `paidAmount` da fatura
4. Se total, marca `isPaid = true`
5. Libera limite do cartão

**Exemplo**:
```
Fatura de R$ 2.300,00

Pagamento total:
- Debita R$ 2.300,00 da conta
- paidAmount = 2.300,00
- isPaid = true
- currentBalance -= 2.300,00
- Limite disponível aumenta R$ 2.300,00

Pagamento parcial de R$ 1.000,00:
- Debita R$ 1.000,00 da conta
- paidAmount = 1.000,00
- isPaid = false
- currentBalance -= 1.000,00
- Limite disponível aumenta R$ 1.000,00
- Restante: R$ 1.300,00 (com juros)
```

### 8.6 Validações Gerais

#### 8.6.1 Validação de Saldo

Antes de criar DESPESA em conta:
```typescript
if (account.balance < transaction.amount) {
  if (!account.allowNegativeBalance) {
    throw new Error('Saldo insuficiente')
  }
  
  if (account.balance - transaction.amount < -account.overdraftLimit) {
    throw new Error('Limite de cheque especial excedido')
  }
}
```

#### 8.6.2 Validação de Data

```typescript
// Data não pode ser futura (exceto agendamentos)
if (transaction.date > new Date() && !transaction.isScheduled) {
  throw new Error('Data não pode ser futura')
}

// Data deve estar no formato correto
if (!isValidDate(transaction.date)) {
  throw new Error('Data inválida')
}
```

#### 8.6.3 Validação de Categoria

```typescript
// Categoria obrigatória
if (!transaction.categoryId) {
  throw new Error('Categoria é obrigatória')
}

// Categoria deve ser do tipo correto
const category = await getCategory(transaction.categoryId)
if (category.type !== transaction.type) {
  throw new Error('Categoria incompatível com tipo de transação')
}
```

#### 8.6.4 Validação de Compartilhamento

```typescript
// Se compartilhada, deve ter pessoas
if (transaction.isShared && (!transaction.sharedWith || transaction.sharedWith.length === 0)) {
  throw new Error('Selecione pelo menos uma pessoa para compartilhar')
}

// Divisão deve somar 100% ou valor total
if (transaction.isShared) {
  const totalPercent = calculateTotalPercent(transaction.sharedPercentages)
  if (Math.abs(totalPercent - 100) > 0.01) {
    throw new Error('A divisão deve somar 100%')
  }
}
```

#### 8.6.5 Validação de Parcelamento

```typescript
// Número de parcelas válido
if (transaction.installments < 2 || transaction.installments > 48) {
  throw new Error('Número de parcelas deve estar entre 2 e 48')
}

// Valor da parcela deve ser positivo
const installmentAmount = transaction.amount / transaction.installments
if (installmentAmount <= 0) {
  throw new Error('Valor da parcela inválido')
}
```

---

## 9. CONSIDERAÇÕES FINAIS

### 9.1 Segurança

- Autenticação via JWT com cookies HTTP-only
- Validação de entrada com Zod
- Sanitização de dados
- Rate limiting nas APIs
- Auditoria de todas as operações

### 9.2 Performance

- Paginação em listas grandes
- Cache de dados frequentes
- Lazy loading de componentes
- Debounce em inputs
- Otimização de queries SQL

### 9.3 Escalabilidade

- Arquitetura modular
- Separação de responsabilidades
- Services reutilizáveis
- Context API para estado global
- API RESTful bem definida

### 9.4 Manutenibilidade

- Código TypeScript tipado
- Comentários em pontos críticos
- Testes unitários e integração
- Documentação completa
- Padrões de código consistentes

### 9.5 Próximos Passos

1. Implementar relatórios avançados
2. Adicionar gráficos e dashboards
3. Exportação para Excel/PDF
4. Integração com bancos (Open Banking)
5. App mobile (React Native)
6. Notificações push
7. Backup automático
8. Multi-moeda avançado
9. IA para categorização automática
10. Previsão de gastos

---

**Documento criado em**: 02/11/2025
**Versão**: 1.0
**Autor**: Sistema SuaGrana

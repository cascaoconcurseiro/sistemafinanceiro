# 🎯 PROMPT COMPLETO - Sistema de Gestão Financeira SuaGrana

## 📋 VISÃO GERAL

Crie um sistema completo de gestão financeira pessoal chamado "SuaGrana" com as seguintes características:

**Stack Tecnológica:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Prisma ORM
- PostgreSQL/SQLite
- Tailwind CSS
- Shadcn/ui
- React Query (@tanstack/react-query)
- NextAuth.js
- Zod (validação)

**Arquitetura:**
- Clean Architecture
- Padrão Repository
- Service Layer
- Double Entry Accounting (Partidas Dobradas)
- Event-Driven Architecture
- Optimistic Updates
- PWA Support

---

## 🗄️ MODELO DE DADOS (Prisma Schema)

### Entidades Principais

#### 1. User (Usuário)
```prisma
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String
  password         String    // bcrypt hash
  avatar           String?
  role             String    @default("USER") // USER | ADMIN
  emailVerified    DateTime?
  isActive         Boolean   @default(true)
  lastLogin        DateTime?
  
  // Perfil Financeiro
  monthlyIncome    Decimal?
  emergencyReserve Decimal?
  riskProfile      String?   // CONSERVATIVE | MODERATE | AGGRESSIVE
  financialGoals   String?   // JSON
  
  // Preferências
  preferences      String?   // JSON
  notificationPreferences String? // JSON
  themeSettings    String?   // JSON
  
  // Relacionamentos
  accounts         Account[]
  transactions     Transaction[]
  categories       Category[]
  goals            Goal[]
  investments      Investment[]
  trips            Trip[]
  budgets          Budget[]
  creditCards      CreditCard[]
  notifications    Notification[]
  reminders        Reminder[]
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

#### 2. Account (Conta Bancária)
```prisma
model Account {
  id        String   @id @default(cuid())
  userId    String
  name      String
  type      String   // CHECKING | SAVINGS | INVESTMENT | CASH
  balance   Decimal  @default(0)
  currency  String   @default("BRL")
  isActive  Boolean  @default(true)
  
  // Cheque Especial
  allowNegativeBalance Boolean @default(false)
  overdraftLimit       Decimal @default(0)
  overdraftInterestRate Decimal?
  
  // Informações Bancárias
  bankCode String?  // 001, 237, 341
  bankName String?  // Banco do Brasil, Bradesco, Itaú
  
  // Investimentos
  isInvestment      Boolean  @default(false)
  investmentType    String?
  currentValue      Decimal?
  investedAmount    Decimal?
  
  // Relacionamentos
  user              User @relation(fields: [userId], references: [id])
  transactions      Transaction[]
  budgets           Budget[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 3. Transaction (Transação)
```prisma
model Transaction {
  id          String   @id @default(cuid())
  userId      String
  accountId   String?
  categoryId  String
  amount      Decimal
  description String
  type        String   // INCOME | EXPENSE | TRANSFER
  date        DateTime
  status      String   @default("cleared") // pending | cleared | reconciled
  
  // Parcelamento
  isInstallment      Boolean @default(false)
  installmentNumber  Int?
  totalInstallments  Int?
  installmentGroupId String?
  
  // Recorrência
  isRecurring Boolean @default(false)
  recurringId String?
  frequency   String? // daily | weekly | monthly | yearly
  
  // Compartilhamento
  isShared          Boolean @default(false)
  sharedWith        String? // JSON array
  myShare           Decimal?
  paidBy            String?
  
  // Cartão de Crédito
  creditCardId String?
  invoiceId    String?
  
  // Viagem
  tripId           String?
  tripExpenseType  String? // shared | regular | trip
  
  // Metadados
  paymentMethod    String?
  isReconciled     Boolean @default(false)
  isTaxDeductible  Boolean @default(false)
  metadata         String? // JSON
  
  // Auditoria
  operationUuid      String? @unique
  transactionGroupId String?
  closedPeriod       Boolean @default(false)
  version            Int     @default(1)
  
  // Relacionamentos
  user       User @relation(fields: [userId], references: [id])
  account    Account? @relation(fields: [accountId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
  creditCard CreditCard? @relation(fields: [creditCardId], references: [id])
  trip       Trip? @relation(fields: [tripId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 4. CreditCard (Cartão de Crédito)
```prisma
model CreditCard {
  id             String   @id @default(cuid())
  userId         String
  name           String
  limit          Decimal
  currentBalance Decimal  @default(0)
  dueDay         Int      // 1-31
  closingDay     Int      // 1-31
  isActive       Boolean  @default(true)
  
  // Configurações
  interestRate      Decimal?
  allowOverLimit    Boolean @default(false)
  overLimitPercent  Int     @default(0) // 0-20%
  brand             String? // Visa, Mastercard, Elo
  lastFourDigits    String?
  paymentAccountId  String?
  
  // Relacionamentos
  user         User @relation(fields: [userId], references: [id])
  transactions Transaction[]
  invoices     Invoice[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 5. Invoice (Fatura do Cartão)
```prisma
model Invoice {
  id           String   @id @default(cuid())
  creditCardId String
  userId       String
  month        Int      // 1-12
  year         Int
  dueDate      DateTime
  closingDate  DateTime
  totalAmount  Decimal  @default(0)
  paidAmount   Decimal  @default(0)
  status       String   @default("open") // open | paid | overdue
  
  // Relacionamentos
  creditCard   CreditCard @relation(fields: [creditCardId], references: [id])
  transactions Transaction[]
  payments     InvoicePayment[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 6. Category (Categoria)
```prisma
model Category {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  type        String   // INCOME | EXPENSE
  parentId    String?
  color       String?
  icon        String?
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  sortOrder   Int      @default(0)
  
  // Relacionamentos
  user         User @relation(fields: [userId], references: [id])
  parent       Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     Category[] @relation("CategoryHierarchy")
  transactions Transaction[]
  budgets      Budget[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 7. Budget (Orçamento)
```prisma
model Budget {
  id         String   @id @default(cuid())
  userId     String
  accountId  String?
  categoryId String
  name       String
  amount     Decimal
  spent      Decimal  @default(0)
  period     String   // monthly | quarterly | yearly
  startDate  DateTime
  endDate    DateTime
  isActive   Boolean  @default(true)
  
  alertThreshold Int @default(80) // %
  
  // Relacionamentos
  user         User @relation(fields: [userId], references: [id])
  account      Account? @relation(fields: [accountId], references: [id])
  category     Category @relation(fields: [categoryId], references: [id])
  transactions Transaction[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 8. Goal (Meta Financeira)
```prisma
model Goal {
  id            String    @id @default(cuid())
  userId        String
  name          String
  description   String?
  currentAmount Decimal   @default(0)
  targetAmount  Decimal
  deadline      DateTime?
  priority      String?   // low | medium | high
  status        String    @default("active") // active | completed | cancelled
  
  // Relacionamentos
  user         User @relation(fields: [userId], references: [id])
  transactions Transaction[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 9. Investment (Investimento)
```prisma
model Investment {
  id            String    @id @default(cuid())
  userId        String
  ticker        String    // PETR4, HGLG11, Tesouro Selic
  name          String
  type          String    // STOCK | REIT | FIXED_INCOME | CRYPTO
  quantity      Decimal
  averagePrice  Decimal
  currentPrice  Decimal?
  totalInvested Decimal
  currentValue  Decimal   @default(0)
  
  // Custos
  brokerageFee  Decimal   @default(0)
  otherFees     Decimal   @default(0)
  
  // Rentabilidade
  profitLoss        Decimal @default(0)
  profitLossPercent Decimal @default(0)
  
  // Renda Fixa
  interestRate  Decimal?
  indexer       String?   // CDI | IPCA | Prefixado
  maturityDate  DateTime?
  
  // Dividendos
  lastDividend      Decimal?
  lastDividendDate  DateTime?
  dividendYield     Decimal?
  
  broker        String?
  purchaseDate  DateTime
  status        String    @default("active")
  
  // Relacionamentos
  user         User @relation(fields: [userId], references: [id])
  transactions Transaction[]
  dividends    Dividend[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 10. Trip (Viagem)
```prisma
model Trip {
  id           String   @id @default(cuid())
  userId       String
  name         String
  destination  String
  description  String?
  startDate    DateTime
  endDate      DateTime
  budget       Decimal  @default(0)
  spent        Decimal  @default(0)
  currency     String   @default("BRL")
  status       String   @default("planned") // planned | ongoing | completed
  participants String?  // JSON array
  
  // Relacionamentos
  user         User @relation(fields: [userId], references: [id])
  transactions Transaction[]
  itinerary    Itinerary[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📄 PÁGINAS E ROTAS

### Páginas Principais

1. **/** - Landing Page / Redirect para Dashboard
2. **/auth/login** - Login
3. **/auth/register** - Registro
4. **/dashboard** - Dashboard Principal
5. **/transactions** - Lista de Transações
6. **/accounts-manager** - Gerenciador de Contas
7. **/credit-cards** - Cartões de Crédito
8. **/credit-card-bills** - Faturas de Cartões
9. **/goals** - Metas Financeiras
10. **/trips** - Viagens
11. **/travel/[id]** - Detalhes da Viagem
12. **/shared** - Despesas Compartilhadas
13. **/family** - Membros da Família
14. **/settings** - Configurações
15. **/audit** - Auditoria do Sistema
16. **/admin** - Painel Administrativo

### Rotas da API

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

#### Contas
- `GET /api/accounts` - Listar contas
- `POST /api/accounts` - Criar conta
- `PUT /api/accounts/[id]` - Atualizar conta
- `DELETE /api/accounts/[id]` - Deletar conta

#### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/[id]` - Atualizar transação
- `DELETE /api/transactions/[id]` - Deletar transação
- `GET /api/transactions/summary` - Resumo
- `GET /api/transactions/optimized` - Lista otimizada

#### Cartões de Crédito
- `GET /api/credit-cards` - Listar cartões
- `POST /api/credit-cards` - Criar cartão
- `PUT /api/credit-cards/[id]` - Atualizar cartão
- `DELETE /api/credit-cards/[id]` - Deletar cartão
- `GET /api/credit-cards/[id]/invoices` - Faturas do cartão
- `POST /api/credit-cards/[id]/invoices/[invoiceId]/pay` - Pagar fatura

#### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/[id]` - Atualizar categoria
- `DELETE /api/categories/[id]` - Deletar categoria

#### Orçamentos
- `GET /api/budgets` - Listar orçamentos
- `POST /api/budgets` - Criar orçamento
- `PUT /api/budgets/[id]` - Atualizar orçamento
- `DELETE /api/budgets/[id]` - Deletar orçamento

#### Metas
- `GET /api/goals` - Listar metas
- `POST /api/goals` - Criar meta
- `PUT /api/goals/[id]` - Atualizar meta
- `DELETE /api/goals/[id]` - Deletar meta

#### Viagens
- `GET /api/trips` - Listar viagens
- `POST /api/trips` - Criar viagem
- `PUT /api/trips/[id]` - Atualizar viagem
- `DELETE /api/trips/[id]` - Deletar viagem
- `POST /api/trips/[id]/link-transactions` - Vincular transações

#### Despesas Compartilhadas
- `GET /api/shared-expenses` - Listar despesas
- `POST /api/shared-expenses` - Criar despesa
- `POST /api/shared-expenses/[id]/pay` - Pagar despesa

#### Dívidas
- `GET /api/debts` - Listar dívidas
- `POST /api/debts` - Criar dívida
- `POST /api/debts/pay` - Pagar dívida

#### Notificações
- `GET /api/notifications` - Listar notificações
- `POST /api/notifications/[id]/read` - Marcar como lida
- `POST /api/notifications/read-all` - Marcar todas como lidas

#### Lembretes
- `GET /api/reminders` - Listar lembretes
- `POST /api/reminders` - Criar lembrete
- `GET /api/reminders/check-overdue` - Verificar vencidos

#### Exportação/Importação
- `POST /api/export` - Exportar dados
- `POST /api/import` - Importar dados

#### Auditoria
- `GET /api/audit` - Relatório de auditoria
- `GET /api/accounting/validate` - Validar contabilidade

#### Cron Jobs
- `POST /api/cron/process-recurring` - Processar recorrentes
- `POST /api/cron/process-scheduled` - Processar agendadas

---

Continua na PARTE 2...

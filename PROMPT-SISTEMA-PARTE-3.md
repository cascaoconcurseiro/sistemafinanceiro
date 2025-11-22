# 🎯 PROMPT COMPLETO - Sistema SuaGrana (PARTE 3 - FINAL)

## 💻 IMPLEMENTAÇÃO TÉCNICA

### Estrutura de Pastas
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Grupo de rotas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Grupo de rotas protegidas
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts-manager/
│   │   ├── credit-cards/
│   │   ├── goals/
│   │   ├── trips/
│   │   └── settings/
│   ├── api/                     # API Routes
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── credit-cards/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── trips/
│   │   ├── shared-expenses/
│   │   ├── debts/
│   │   ├── notifications/
│   │   └── audit/
│   ├── layout.tsx               # Layout raiz
│   └── page.tsx                 # Página inicial
├── components/                   # Componentes React
│   ├── features/                # Componentes por feature
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── credit-cards/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── trips/
│   │   └── shared-expenses/
│   ├── ui/                      # Componentes Shadcn/ui
│   ├── layout/                  # Layouts
│   ├── modals/                  # Modais
│   └── providers/               # Context Providers
├── lib/                         # Bibliotecas e utilitários
│   ├── services/                # Lógica de negócio
│   │   ├── financial-operations-service.ts
│   │   ├── double-entry-service.ts
│   │   ├── credit-card-service.ts
│   │   ├── budget-service.ts
│   │   └── notification-service.ts
│   ├── utils/                   # Funções utilitárias
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── calculations.ts
│   │   └── validation.ts
│   ├── validation/              # Schemas Zod
│   │   ├── transaction.ts
│   │   ├── account.ts
│   │   └── credit-card.ts
│   ├── hooks/                   # Custom Hooks
│   ├── api/                     # API Client
│   └── prisma.ts                # Prisma Client
├── contexts/                    # React Contexts
│   ├── unified-financial-context.tsx
│   ├── notification-context.tsx
│   └── period-context.tsx
├── types/                       # TypeScript Types
│   ├── database.ts
│   ├── api.ts
│   └── index.ts
└── styles/                      # Estilos globais
    └── globals.css
```

### Serviços Principais

#### 1. FinancialOperationsService
```typescript
class FinancialOperationsService {
  // Criar transação com partidas dobradas
  async createTransaction(data: TransactionInput): Promise<Transaction>
  
  // Criar transferência entre contas
  async createTransfer(data: TransferInput): Promise<Transaction[]>
  
  // Criar transação parcelada
  async createInstallmentTransaction(data: InstallmentInput): Promise<Transaction[]>
  
  // Criar transação recorrente
  async createRecurringTransaction(data: RecurringInput): Promise<Transaction>
  
  // Atualizar transação
  async updateTransaction(id: string, data: TransactionInput): Promise<Transaction>
  
  // Deletar transação (soft delete)
  async deleteTransaction(id: string): Promise<void>
  
  // Reconciliar transação
  async reconcileTransaction(id: string): Promise<Transaction>
}
```

#### 2. DoubleEntryService
```typescript
class DoubleEntryService {
  // Criar lançamentos contábeis
  async createJournalEntries(transaction: Transaction): Promise<JournalEntry[]>
  
  // Validar balanceamento
  async validateBalance(): Promise<boolean>
  
  // Recalcular saldos
  async recalculateBalances(accountId: string): Promise<void>
  
  // Auditoria contábil
  async auditAccounting(): Promise<AuditReport>
}
```

#### 3. CreditCardService
```typescript
class CreditCardService {
  // Gerar fatura do mês
  async generateInvoice(cardId: string, month: number, year: number): Promise<Invoice>
  
  // Pagar fatura
  async payInvoice(invoiceId: string, accountId: string, amount: Decimal): Promise<InvoicePayment>
  
  // Calcular próxima fatura
  async calculateNextInvoice(cardId: string): Promise<InvoicePreview>
  
  // Verificar limite disponível
  async checkAvailableLimit(cardId: string): Promise<Decimal>
}
```

#### 4. BudgetService
```typescript
class BudgetService {
  // Criar orçamento
  async createBudget(data: BudgetInput): Promise<Budget>
  
  // Calcular gasto atual
  async calculateSpent(budgetId: string): Promise<Decimal>
  
  // Verificar alertas
  async checkAlerts(budgetId: string): Promise<Alert[]>
  
  // Projetar gastos
  async projectSpending(budgetId: string): Promise<Projection>
}
```

#### 5. NotificationService
```typescript
class NotificationService {
  // Criar notificação
  async createNotification(data: NotificationInput): Promise<Notification>
  
  // Enviar notificação
  async sendNotification(userId: string, notification: Notification): Promise<void>
  
  // Verificar lembretes vencidos
  async checkOverdueReminders(): Promise<Reminder[]>
  
  // Verificar faturas próximas
  async checkUpcomingInvoices(): Promise<Invoice[]>
}
```

### Validações Zod

#### Transaction Schema
```typescript
const transactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  date: z.date(),
  categoryId: z.string().cuid(),
  accountId: z.string().cuid().optional(),
  creditCardId: z.string().cuid().optional(),
  isInstallment: z.boolean().optional(),
  totalInstallments: z.number().int().min(2).max(48).optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  isShared: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
}).refine(data => data.accountId || data.creditCardId, {
  message: "Conta ou cartão é obrigatório"
});
```

### Hooks Customizados

#### useTransactions
```typescript
function useTransactions(filters?: TransactionFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
  });
  
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
    },
  });
  
  return {
    transactions: data,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
  };
}
```

#### useAccounts
```typescript
function useAccounts() {
  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });
  
  return {
    accounts: data,
    isLoading,
    totalBalance: data?.reduce((sum, acc) => sum + acc.balance, 0),
  };
}
```

### Context API

#### UnifiedFinancialContext
```typescript
const UnifiedFinancialContext = createContext<{
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  creditCards: CreditCard[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}>();
```

### Cálculos Financeiros

#### Cálculo de Saldo
```typescript
function calculateAccountBalance(accountId: string, transactions: Transaction[]): Decimal {
  return transactions
    .filter(t => t.accountId === accountId)
    .reduce((balance, t) => {
      if (t.type === 'INCOME') return balance + t.amount;
      if (t.type === 'EXPENSE') return balance - t.amount;
      return balance;
    }, 0);
}
```

#### Cálculo de Orçamento
```typescript
function calculateBudgetSpent(budget: Budget, transactions: Transaction[]): Decimal {
  return transactions
    .filter(t => 
      t.categoryId === budget.categoryId &&
      t.date >= budget.startDate &&
      t.date <= budget.endDate &&
      t.type === 'EXPENSE'
    )
    .reduce((sum, t) => sum + t.amount, 0);
}
```

#### Simplificação de Dívidas
```typescript
function simplifyDebts(debts: SharedDebt[]): Payment[] {
  // Algoritmo de simplificação de dívidas
  // Reduz número de transações necessárias
  const balances = new Map<string, Decimal>();
  
  // Calcula saldo líquido de cada pessoa
  debts.forEach(debt => {
    balances.set(debt.creditorId, (balances.get(debt.creditorId) || 0) + debt.amount);
    balances.set(debt.debtorId, (balances.get(debt.debtorId) || 0) - debt.amount);
  });
  
  // Separa credores e devedores
  const creditors = Array.from(balances.entries()).filter(([_, balance]) => balance > 0);
  const debtors = Array.from(balances.entries()).filter(([_, balance]) => balance < 0);
  
  // Cria pagamentos otimizados
  const payments: Payment[] = [];
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const [creditorId, creditAmount] = creditors[i];
    const [debtorId, debtAmount] = debtors[j];
    
    const amount = Math.min(creditAmount, Math.abs(debtAmount));
    
    payments.push({
      from: debtorId,
      to: creditorId,
      amount,
    });
    
    creditors[i][1] -= amount;
    debtors[j][1] += amount;
    
    if (creditors[i][1] === 0) i++;
    if (debtors[j][1] === 0) j++;
  }
  
  return payments;
}
```

---

## 🎨 DESIGN SYSTEM

### Cores
```css
:root {
  --primary: #3b82f6;      /* Blue */
  --secondary: #8b5cf6;    /* Purple */
  --success: #10b981;      /* Green */
  --warning: #f59e0b;      /* Orange */
  --danger: #ef4444;       /* Red */
  --info: #06b6d4;         /* Cyan */
  
  --background: #ffffff;
  --foreground: #0f172a;
  --muted: #f1f5f9;
  --border: #e2e8f0;
}

.dark {
  --background: #0f172a;
  --foreground: #f1f5f9;
  --muted: #1e293b;
  --border: #334155;
}
```

### Tipografia
```css
font-family: 'Inter', sans-serif;

h1: 2.5rem / 40px
h2: 2rem / 32px
h3: 1.5rem / 24px
h4: 1.25rem / 20px
body: 1rem / 16px
small: 0.875rem / 14px
```

### Espaçamento
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

---

## 🔐 SEGURANÇA

### Autenticação
```typescript
// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!isValid) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
```

### Middleware de Autenticação
```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Rate limiting
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/api/:path*',
  ],
};
```

---

## 📱 RESPONSIVIDADE

### Breakpoints
```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
2xl: 1536px /* Extra Large */
```

### Layout Adaptativo
- Mobile: Stack vertical, menu hambúrguer
- Tablet: 2 colunas, sidebar colapsável
- Desktop: 3 colunas, sidebar fixa

---

## 🚀 DEPLOY

### Variáveis de Ambiente
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://..."

# Email (opcional)
SMTP_HOST="..."
SMTP_PORT="..."
SMTP_USER="..."
SMTP_PASS="..."

# Storage (opcional)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET="..."
```

### Build
```bash
npm run build
npm run start
```

### Plataformas Recomendadas
- Vercel (recomendado)
- Netlify
- Railway
- Render

---

## 📝 DOCUMENTAÇÃO ADICIONAL

### README.md
- Descrição do projeto
- Instalação
- Configuração
- Uso
- Contribuição
- Licença

### API Documentation
- Swagger/OpenAPI
- Endpoints
- Schemas
- Exemplos

### User Guide
- Como usar cada funcionalidade
- Tutoriais
- FAQ
- Troubleshooting

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup
- [ ] Criar projeto Next.js
- [ ] Configurar TypeScript
- [ ] Configurar Prisma
- [ ] Configurar Tailwind CSS
- [ ] Instalar Shadcn/ui
- [ ] Configurar NextAuth

### Fase 2: Database
- [ ] Criar schema Prisma
- [ ] Executar migrations
- [ ] Seed inicial (categorias padrão)

### Fase 3: Autenticação
- [ ] Página de login
- [ ] Página de registro
- [ ] Middleware de proteção
- [ ] Context de usuário

### Fase 4: Core Features
- [ ] CRUD de contas
- [ ] CRUD de transações
- [ ] CRUD de categorias
- [ ] Sistema de partidas dobradas
- [ ] Dashboard básico

### Fase 5: Cartões de Crédito
- [ ] CRUD de cartões
- [ ] Geração de faturas
- [ ] Pagamento de faturas
- [ ] Alertas de vencimento

### Fase 6: Orçamentos e Metas
- [ ] CRUD de orçamentos
- [ ] Cálculo de gastos
- [ ] Alertas de limite
- [ ] CRUD de metas
- [ ] Progresso de metas

### Fase 7: Features Avançadas
- [ ] Investimentos
- [ ] Viagens
- [ ] Despesas compartilhadas
- [ ] Relatórios
- [ ] Exportação/Importação

### Fase 8: Polish
- [ ] Notificações
- [ ] PWA
- [ ] Performance
- [ ] Testes
- [ ] Documentação

---

## 🎯 RESULTADO ESPERADO

Um sistema completo de gestão financeira pessoal com:
- ✅ Interface moderna e responsiva
- ✅ Funcionalidades completas
- ✅ Performance otimizada
- ✅ Segurança robusta
- ✅ Código limpo e manutenível
- ✅ Documentação completa
- ✅ Pronto para produção

**Tempo estimado:** 3-6 meses (1 desenvolvedor full-time)

---

**FIM DO PROMPT COMPLETO**

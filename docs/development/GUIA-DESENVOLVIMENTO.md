# 👨‍💻 Guia de Desenvolvimento - SuaGrana

## Para Desenvolvedores

Este guia contém tudo que você precisa para contribuir com o projeto.

---

## 🚀 SETUP INICIAL

### Pré-requisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 14.0
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/suagrana.git
cd suagrana

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local

# Execute migrations
npm run db:migrate

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/suagrana"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN="seu-dsn-aqui"

# Analytics (opcional)
NEXT_PUBLIC_GA_ID="seu-ga-id"
```

---

## 📁 ESTRUTURA DO PROJETO

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   ├── (auth)/            # Rotas de autenticação
│   └── (dashboard)/       # Rotas do dashboard
│
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── features/         # Componentes de funcionalidades
│   ├── layout/           # Componentes de layout
│   └── modals/           # Modais
│
├── lib/                   # Bibliotecas e utilitários
│   ├── services/         # Serviços de negócio
│   ├── validations/      # Schemas Zod
│   ├── ml/               # Machine Learning
│   ├── insights/         # Gerador de insights
│   ├── performance/      # Performance monitoring
│   └── middleware/       # Middlewares
│
├── hooks/                 # Custom hooks
│   ├── use-swipe.tsx
│   ├── use-keyboard-shortcuts.tsx
│   └── use-online-status.tsx
│
├── contexts/              # React Contexts
│   └── unified-financial-context.tsx
│
└── styles/                # Estilos globais
    └── globals.css
```

---

## 🧪 TESTES

### Executar Testes

```bash
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage

# E2E
npm run test:e2e
```

### Escrever Testes

**Teste Unitário:**
```typescript
// src/lib/__tests__/utils.test.ts
import { formatCurrency } from '../utils'

describe('formatCurrency', () => {
  it('deve formatar valores em BRL', () => {
    expect(formatCurrency(1500.5)).toBe('R$ 1.500,50')
  })
})
```

**Teste de Componente:**
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '../ui/button'

describe('Button', () => {
  it('deve renderizar corretamente', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

**Teste E2E:**
```typescript
// e2e/transaction-flow.spec.ts
test('deve criar transação', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('[data-testid="new-transaction"]')
  await page.fill('[name="description"]', 'Teste')
  await page.fill('[name="amount"]', '100')
  await page.click('[type="submit"]')
  await expect(page.locator('text=Teste')).toBeVisible()
})
```

---

## 🎨 COMPONENTES

### Criar Novo Componente

```typescript
// src/components/ui/my-component.tsx
'use client'

import { cn } from '@/lib/utils'

interface MyComponentProps {
  className?: string
  children: React.ReactNode
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn('base-classes', className)}>
      {children}
    </div>
  )
}
```

### Usar Componentes Existentes

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VirtualizedList } from '@/components/ui/virtualized-list'

<Button variant="default" size="lg">
  Clique aqui
</Button>

<VirtualizedList
  items={transactions}
  itemHeight={80}
  height={600}
  renderItem={(item) => <TransactionItem transaction={item} />}
/>
```

---

## 🔌 API ROUTES

### Criar Nova API

```typescript
// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { transactionSchema } from '@/lib/validations/transaction'

export const POST = withRateLimit(
  async (req: NextRequest) => {
    try {
      const body = await req.json()
      
      // Validar
      const result = transactionSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { errors: result.error.flatten() },
          { status: 400 }
        )
      }
      
      // Processar
      const transaction = await createTransaction(result.data)
      
      return NextResponse.json(transaction)
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  },
  'write' // rate limit type
)
```

### Usar API no Cliente

```typescript
// src/lib/api/transactions.ts
export async function createTransaction(data: TransactionInput) {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create transaction')
  }
  
  return response.json()
}
```

---

## 🎯 VALIDAÇÃO

### Criar Schema Zod

```typescript
// src/lib/validations/my-schema.ts
import { z } from 'zod'

export const mySchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  age: z.number().int().positive(),
})

export type MyInput = z.infer<typeof mySchema>
```

### Usar Validação

```typescript
const result = mySchema.safeParse(data)

if (!result.success) {
  console.error(result.error.flatten())
  return
}

// Dados validados e tipados
const validData = result.data
```

---

## 📊 ANALYTICS

### Rastrear Eventos

```typescript
import { analytics, AnalyticsEvents } from '@/lib/analytics'

// Evento simples
analytics.track(AnalyticsEvents.TRANSACTION_CREATED, {
  type: 'expense',
  amount: 100,
  category: 'food',
})

// Identificar usuário
analytics.identify(userId, {
  email: user.email,
  plan: 'premium',
})

// Page view
analytics.page('Dashboard')
```

---

## ⚡ PERFORMANCE

### Medir Performance

```typescript
import { performanceMonitor } from '@/lib/performance/monitor'

// Função síncrona
const result = performanceMonitor.measure('calculateTotal', () => {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
})

// Função assíncrona
const data = await performanceMonitor.measureAsync('fetchData', async () => {
  return await fetch('/api/data').then(r => r.json())
})
```

### Otimizações

**1. Memoização:**
```typescript
const total = useMemo(() => {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}, [transactions])
```

**2. Callback:**
```typescript
const handleClick = useCallback(() => {
  doSomething()
}, [dependency])
```

**3. Virtualização:**
```typescript
<VirtualizedList
  items={largeArray}
  itemHeight={80}
  height={600}
  renderItem={(item) => <Item item={item} />}
/>
```

---

## 🔒 SEGURANÇA

### Rate Limiting

```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit'

export const POST = withRateLimit(handler, 'write')
```

### Validação de Entrada

```typescript
// SEMPRE valide entrada do usuário
const result = schema.safeParse(input)
if (!result.success) {
  return error
}
```

### Sanitização

```typescript
import DOMPurify from 'isomorphic-dompurify'

const clean = DOMPurify.sanitize(userInput)
```

---

## 🎨 ESTILO E DESIGN

### Tailwind CSS

```typescript
// Usar classes do Tailwind
<div className="flex items-center gap-4 p-4 rounded-lg border">
  Content
</div>

// Combinar com cn()
<div className={cn('base-class', condition && 'conditional-class', className)}>
  Content
</div>
```

### Design Tokens

```typescript
// Cores
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-destructive text-destructive-foreground

// Espaçamento
p-4 m-2 gap-4 space-y-4

// Tipografia
text-sm text-base text-lg text-xl
font-normal font-medium font-semibold font-bold
```

---

## 🐛 DEBUG

### Console Logs

```typescript
// Desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

### React DevTools

```bash
# Instalar extensão do navegador
Chrome: React Developer Tools
Firefox: React Developer Tools
```

### Network Inspector

```
F12 → Network → Ver requisições
```

---

## 📦 BUILD E DEPLOY

### Build Local

```bash
# Build de produção
npm run build

# Testar build
npm run start
```

### Deploy

**Vercel (Recomendado):**
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel
```

**Netlify:**
```bash
# Instalar CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## 🔄 GIT WORKFLOW

### Branches

```
main          → Produção
develop       → Desenvolvimento
feature/*     → Novas funcionalidades
bugfix/*      → Correções
hotfix/*      → Correções urgentes
```

### Commits

```bash
# Formato
<type>(<scope>): <subject>

# Exemplos
feat(transactions): add auto-categorization
fix(invoices): correct calculation bug
docs(readme): update installation guide
test(utils): add formatCurrency tests
```

### Pull Request

```markdown
## Descrição
Breve descrição da mudança

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Testes passando
- [ ] Código revisado
- [ ] Documentação atualizada
```

---

## 📚 RECURSOS

### Documentação

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma](https://www.prisma.io/docs)
- [Zod](https://zod.dev)

### Ferramentas

- [VS Code](https://code.visualstudio.com)
- [Postman](https://www.postman.com)
- [Prisma Studio](https://www.prisma.io/studio)

### Comunidade

- GitHub Issues
- Discord
- Stack Overflow

---

## 🎯 BOAS PRÁTICAS

### Código

1. ✅ Use TypeScript sempre
2. ✅ Valide todas as entradas
3. ✅ Escreva testes
4. ✅ Documente funções complexas
5. ✅ Use nomes descritivos
6. ✅ Mantenha funções pequenas
7. ✅ Evite duplicação

### Performance

1. ✅ Memoize cálculos pesados
2. ✅ Use virtualização em listas grandes
3. ✅ Lazy load componentes
4. ✅ Otimize imagens
5. ✅ Minimize bundle size

### Segurança

1. ✅ Nunca exponha secrets
2. ✅ Valide no servidor
3. ✅ Use rate limiting
4. ✅ Sanitize inputs
5. ✅ Use HTTPS

---

## 🆘 TROUBLESHOOTING

### Erro de Build

```bash
# Limpar cache
rm -rf .next node_modules
npm install
npm run build
```

### Erro de Tipos

```bash
# Regenerar tipos do Prisma
npm run db:generate
```

### Testes Falhando

```bash
# Limpar cache do Jest
npm test -- --clearCache
npm test
```

---

**Versão:** 1.0  
**Última Atualização:** 22/11/2025

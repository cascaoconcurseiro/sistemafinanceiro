# 🚀 PROMPT RESUMIDO - Clone do SuaGrana

## 📝 Prompt Curto (Para IA)

```
Crie um sistema completo de gestão financeira pessoal com Next.js 14, TypeScript, Prisma, PostgreSQL, Tailwind CSS e Shadcn/ui.

FUNCIONALIDADES PRINCIPAIS:
1. Dashboard com resumo financeiro e gráficos
2. Gestão de contas bancárias (corrente, poupança, investimento)
3. Transações (receitas, despesas, transferências)
4. Cartões de crédito com geração automática de faturas
5. Orçamentos por categoria com alertas
6. Metas financeiras com acompanhamento
7. Investimentos (ações, FIIs, renda fixa, cripto)
8. Viagens com controle de gastos
9. Despesas compartilhadas com simplificação de dívidas
10. Sistema de partidas dobradas (contabilidade)
11. Notificações inteligentes
12. Relatórios e análises
13. PWA com suporte offline

MODELO DE DADOS:
- User (usuário)
- Account (contas bancárias)
- Transaction (transações)
- CreditCard (cartões de crédito)
- Invoice (faturas)
- Category (categorias)
- Budget (orçamentos)
- Goal (metas)
- Investment (investimentos)
- Trip (viagens)
- SharedExpense (despesas compartilhadas)
- SharedDebt (dívidas)
- Notification (notificações)
- JournalEntry (lançamentos contábeis)

REGRAS DE NEGÓCIO:
- Partidas dobradas: toda transação gera débito e crédito
- Faturas de cartão: fecham no dia configurado, vencem X dias depois
- Orçamentos: alertam quando atingir 80%, 90%, 100%
- Parcelamento: cria N transações vinculadas
- Recorrência: cria próxima transação automaticamente
- Despesas compartilhadas: divide entre participantes e simplifica dívidas

ARQUITETURA:
- Clean Architecture
- Service Layer (FinancialOperationsService, DoubleEntryService, etc)
- React Query para cache e estado
- Optimistic Updates
- Validação com Zod
- NextAuth para autenticação
- Rate Limiting e segurança

PÁGINAS:
/dashboard, /transactions, /accounts-manager, /credit-cards, /goals, /trips, /shared, /settings

API ROUTES:
/api/auth, /api/accounts, /api/transactions, /api/credit-cards, /api/categories, /api/budgets, /api/goals, /api/trips, /api/shared-expenses, /api/debts, /api/notifications

Use Shadcn/ui para componentes, Tailwind para estilos, e implemente com TypeScript strict mode.
```

---

## 📚 Documentação Completa

Para detalhes completos, consulte:
- **PROMPT-SISTEMA-PARTE-1.md** - Modelo de dados e rotas
- **PROMPT-SISTEMA-PARTE-2.md** - Funcionalidades e regras de negócio
- **PROMPT-SISTEMA-PARTE-3.md** - Implementação técnica e código

---

## 🎯 Comando Rápido para IA

```
Crie um clone do sistema SuaGrana: gestão financeira completa com Next.js 14, TypeScript, Prisma, PostgreSQL. 

Inclua: dashboard, contas, transações, cartões de crédito com faturas, orçamentos, metas, investimentos, viagens, despesas compartilhadas, partidas dobradas, notificações, relatórios e PWA.

Use: Shadcn/ui, Tailwind, React Query, NextAuth, Zod.

Arquitetura: Clean Architecture, Service Layer, Optimistic Updates.

Consulte PROMPT-SISTEMA-PARTE-1.md, PARTE-2.md e PARTE-3.md para detalhes completos.
```

---

## 📦 Pacotes Necessários

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "next-auth": "^4.24.0",
    "zod": "^3.22.0",
    "bcrypt": "^5.1.1",
    "date-fns": "^2.30.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/bcrypt": "^5.0.0"
  }
}
```

---

## 🏗️ Estrutura Mínima

```
src/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── transactions/
│   └── layout.tsx
├── components/
│   ├── features/
│   └── ui/
├── lib/
│   ├── services/
│   ├── utils/
│   └── prisma.ts
└── types/
```

---

## ⚡ Quick Start

```bash
# 1. Criar projeto
npx create-next-app@latest suagrana --typescript --tailwind --app

# 2. Instalar dependências
npm install @prisma/client @tanstack/react-query next-auth zod bcrypt

# 3. Configurar Prisma
npx prisma init

# 4. Copiar schema do PROMPT-SISTEMA-PARTE-1.md

# 5. Executar migrations
npx prisma migrate dev

# 6. Iniciar desenvolvimento
npm run dev
```

---

**Tempo estimado:** 3-6 meses (1 dev full-time)  
**Complexidade:** Alta  
**Nível:** Avançado

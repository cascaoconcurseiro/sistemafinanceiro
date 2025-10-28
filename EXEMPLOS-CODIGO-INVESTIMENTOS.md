# 💻 EXEMPLOS DE CÓDIGO: Nova Página de Investimentos

**Data:** 28/10/2025  
**Objetivo:** Código pronto para implementação da nova página

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   └── features/
│       └── investments/
│           ├── investment-dashboard.tsx          # Dashboard principal
│           ├── investment-modal.tsx              # Modal de cadastro
│           ├── price-update-modal.tsx            # Atualização de cotações
│           ├── dividend-modal.tsx                # Registro de dividendos
│           ├── tax-calculator.tsx                # Calculadora de IR
│           ├── rebalancing-panel.tsx             # Rebalanceamento
│           ├── investment-simulator.tsx          # Simulador
│           ├── calendar-events.tsx               # Calendário
│           ├── charts/
│           │   ├── allocation-chart.tsx          # Gráfico pizza
│           │   ├── evolution-chart.tsx           # Gráfico linha
│           │   └── performance-chart.tsx         # Gráfico barras
│           └── cards/
│               ├── metric-card.tsx               # Card de métrica
│               ├── asset-card.tsx                # Card de ativo
│               └── event-card.tsx                # Card de evento
├── lib/
│   ├── services/
│   │   └── investment-service.ts                 # Serviço principal
│   ├── hooks/
│   │   ├── use-investment-portfolio.ts           # Hook de portfólio
│   │   ├── use-investment-performance.ts         # Hook de performance
│   │   └── use-investment-mutations.ts           # Hook de mutações
│   └── utils/
│       ├── investment-calculations.ts            # Cálculos
│       └── investment-validators.ts              # Validações
└── types/
    └── investment.ts                             # Tipos TypeScript
```

---

## 🎯 TIPOS TYPESCRIPT

```typescript
// types/investment.ts

export type InvestmentType = 
  | 'FIXED_INCOME'
  | 'STOCK'
  | 'REIT'
  | 'CRYPTO'
  | 'INTERNATIONAL'
  | 'PENSION'
  | 'OTHER';

export type InvestmentCategory =
  // Renda Fixa
  | 'TESOURO_DIRETO'
  | 'CDB'
  | 'LCI_LCA'
  | 'DEBENTURE'
  // Ações
  | 'STOCK_BR'
  | 'STOCK_US'
  | 'ETF'
  // FIIs
  | 'REIT_LOGISTIC'
  | 'REIT_COMMERCIAL'
  | 'REIT_RESIDENTIAL'
  | 'REIT_PAPER'
  // Cripto
  | 'BITCOIN'
  | 'ETHEREUM'
  | 'OTHER_CRYPTO'
  // Outros
  | 'PENSION_PGBL'
  | 'PENSION_VGBL'
  | 'OTHER';

export interface Investment {
  id: string;
  userId: string;
  
  // Dados Básicos
  ticker: string;
  name: string;
  type: InvestmentType;
  category: InvestmentCategory;
  
  // Quantidade e Valores
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  
  // Custos
  brokerageFee?: number;
  otherFees?: number;
  
  // Rentabilidade
  profitLoss: number;
  profitLossPercent: number;
  
  // Renda Fixa Específico
  interestRate?: number;
  indexer?: string;
  maturityDate?: Date;
  liquidity?: string;
  
  // Dividendos
  lastDividend?: number;
  lastDividendDate?: Date;
  dividendYield?: number;
  
  // Metadados
  broker?: string;
  purchaseDate: Date;
  notes?: string;
  
  // Relacionamentos
  dividends?: Dividend[];
  
  // Auditoria
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Dividend {
  id: string;
  investmentId: string;
  userId: string;
  
  type: 'DIVIDEND' | 'JCP' | 'INCOME' | 'INTEREST';
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  
  paymentDate: Date;
  exDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentPortfolio {
  investments: Investment[];
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: Record<InvestmentType, number>;
  monthlyDividends: number;
  dividendYield: number;
  monthlyChange: number;
  monthlyChangePercent: number;
}

export interface InvestmentPerformance {
  annualReturn: number;
  cdiBenchmark: number;
  ibovBenchmark: number;
  ipcaBenchmark: number;
  evolution: EvolutionPoint[];
  performanceByType: Record<InvestmentType, number>;
}

export interface EvolutionPoint {
  date: Date;
  value: number;
  invested: number;
  profit: number;
}

export interface RebalancingSuggestion {
  type: InvestmentType;
  action: 'BUY' | 'SELL';
  amount: number;
  reason: string;
}

export interface TaxCalculation {
  stockTax: number;
  fixedIncomeTax: number;
  reitTax: number;
  total: number;
  dueDate: Date;
}
```

---

## 🎨 COMPONENTE: Dashboard Principal

```typescript
// components/features/investments/investment-dashboard.tsx

'use client';

import { useState } from 'react';
import { TrendingUp, DollarSign, BarChart, Calendar, RefreshCw } from 'lucide-react';
import { useInvestmentPortfolio } from '@/lib/hooks/use-investment-portfolio';
import { useInvestmentPerformance } from '@/lib/hooks/use-investment-performance';
import { MetricCard } from './cards/metric-card';
import { AllocationChart } from './charts/allocation-chart';
import { EvolutionChart } from './charts/evolution-chart';
import { InvestmentList } from './investment-list';
import { InvestmentModal } from './investment-modal';
import { PriceUpdateModal } from './price-update-modal';
import { CalendarEvents } from './calendar-events';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface InvestmentDashboardProps {
  userId: string;
}

export function InvestmentDashboard({ userId }: InvestmentDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPriceUpdateOpen, setIsPriceUpdateOpen] = useState(false);
  
  const { data: portfolio, isLoading: portfolioLoading } = useInvestmentPortfolio(userId);
  const { data: performance, isLoading: performanceLoading } = useInvestmentPerformance(userId);
  
  if (portfolioLoading || performanceLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!portfolio || !performance) {
    return <EmptyState onCreateClick={() => setIsCreateModalOpen(true)} />;
  }
  
  const cdiBeat = performance.annualReturn - performance.cdiBenchmark;
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💎 Meu Portfólio</h1>
          <p className="text-muted-foreground">
            Gerencie seus investimentos de forma inteligente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPriceUpdateOpen(true)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Cotações
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            + Novo Ativo
          </Button>
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          title="Patrimônio Total"
          value={portfolio.totalValue}
          change={portfolio.monthlyChangePercent}
          changeType={portfolio.monthlyChangePercent >= 0 ? 'positive' : 'negative'}
          subtitle="vs mês anterior"
          format="currency"
        />
        
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Rentabilidade Ano"
          value={performance.annualReturn}
          change={cdiBeat}
          changeType={cdiBeat >= 0 ? 'positive' : 'negative'}
          subtitle={`CDI: ${performance.cdiBenchmark.toFixed(1)}%`}
          format="percentage"
        />
        
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          title="Dividendos/Mês"
          value={portfolio.monthlyDividends}
          subtitle={`Yield: ${portfolio.dividendYield.toFixed(2)}%`}
          format="currency"
        />
        
        <MetricCard
          icon={<BarChart className="w-5 h-5" />}
          title="Lucro Total"
          value={portfolio.profitLoss}
          change={portfolio.profitLossPercent}
          changeType={portfolio.profitLoss >= 0 ? 'positive' : 'negative'}
          subtitle="desde o início"
          format="currency"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart
          data={portfolio.allocation}
          totalValue={portfolio.totalValue}
        />
        
        <EvolutionChart
          data={performance.evolution}
          benchmarks={{
            cdi: performance.cdiBenchmark,
            ibov: performance.ibovBenchmark,
          }}
        />
      </div>
      
      {/* Investment List */}
      <InvestmentList
        investments={portfolio.investments}
        onEdit={(investment) => {
          // TODO: Open edit modal
        }}
      />
      
      {/* Calendar Events */}
      <CalendarEvents userId={userId} />
      
      {/* Modals */}
      <InvestmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <PriceUpdateModal
        isOpen={isPriceUpdateOpen}
        onClose={() => setIsPriceUpdateOpen(false)}
        investments={portfolio.investments}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
      <div className="text-6xl">📊</div>
      <h2 className="text-2xl font-bold">Nenhum investimento cadastrado</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Comece a construir seu portfólio de investimentos agora mesmo.
        Cadastre seu primeiro ativo e acompanhe sua evolução!
      </p>
      <Button size="lg" onClick={onCreateClick}>
        + Cadastrar Primeiro Investimento
      </Button>
    </div>
  );
}
```


---

#
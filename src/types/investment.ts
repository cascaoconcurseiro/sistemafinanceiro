// ============================================
// TYPES E INTERFACES - INVESTIMENTOS
// ============================================

import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// ENUMS
// ============================================

export enum InvestmentType {
  FIXED_INCOME = 'FIXED_INCOME',      // Renda Fixa
  STOCK = 'STOCK',                    // Ações
  REIT = 'REIT',                      // FIIs
  CRYPTO = 'CRYPTO',                  // Criptomoedas
  INTERNATIONAL = 'INTERNATIONAL',    // Internacional
  PENSION = 'PENSION',                // Previdência
  OTHER = 'OTHER'                     // Outros
}

export enum InvestmentCategory {
  // Renda Fixa
  TESOURO_DIRETO = 'TESOURO_DIRETO',
  CDB = 'CDB',
  LCI_LCA = 'LCI_LCA',
  DEBENTURE = 'DEBENTURE',
  
  // Ações
  STOCK_BR = 'STOCK_BR',
  STOCK_US = 'STOCK_US',
  ETF = 'ETF',
  
  // FIIs
  REIT_LOGISTIC = 'REIT_LOGISTIC',
  REIT_COMMERCIAL = 'REIT_COMMERCIAL',
  REIT_RESIDENTIAL = 'REIT_RESIDENTIAL',
  REIT_PAPER = 'REIT_PAPER',
  
  // Cripto
  BITCOIN = 'BITCOIN',
  ETHEREUM = 'ETHEREUM',
  OTHER_CRYPTO = 'OTHER_CRYPTO',
  
  // Outros
  PENSION_PGBL = 'PENSION_PGBL',
  PENSION_VGBL = 'PENSION_VGBL',
  OTHER = 'OTHER'
}

export enum DividendType {
  DIVIDEND = 'DIVIDEND',    // Dividendo
  JCP = 'JCP',              // Juros sobre Capital Próprio
  INCOME = 'INCOME',        // Rendimento (FIIs)
  INTEREST = 'INTEREST'     // Juros (Renda Fixa)
}

export enum RiskProfile {
  CONSERVATIVE = 'CONSERVATIVE',  // Conservador
  MODERATE = 'MODERATE',          // Moderado
  AGGRESSIVE = 'AGGRESSIVE'       // Arrojado
}

export enum InvestmentEventType {
  DIVIDEND = 'DIVIDEND',          // Pagamento de dividendo
  MATURITY = 'MATURITY',          // Vencimento
  TAX_DUE = 'TAX_DUE',           // IR a pagar
  REBALANCE = 'REBALANCE',       // Rebalanceamento
  PRICE_ALERT = 'PRICE_ALERT'    // Alerta de preço
}

export enum InvestmentStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  MATURED = 'matured',
  CANCELLED = 'cancelled'
}

// ============================================
// INTERFACES
// ============================================

export interface Investment {
  id: string;
  userId: string;
  
  // Dados Básicos
  ticker: string;
  name: string;
  symbol?: string;
  type: InvestmentType;
  category?: InvestmentCategory;
  
  // Quantidade e Valores
  quantity: Decimal;
  averagePrice: Decimal;
  purchasePrice: Decimal;
  currentPrice?: Decimal;
  totalInvested: Decimal;
  currentValue: Decimal;
  
  // Custos
  brokerageFee: Decimal;
  otherFees: Decimal;
  fees: Decimal;
  
  // Rentabilidade
  profitLoss: Decimal;
  profitLossPercent: Decimal;
  
  // Renda Fixa
  interestRate?: Decimal;
  indexer?: string;
  maturityDate?: Date;
  liquidity?: string;
  
  // Dividendos
  lastDividend?: Decimal;
  lastDividendDate?: Date;
  dividendYield?: Decimal;
  
  // Metadados
  broker?: string;
  purchaseDate: Date;
  notes?: string;
  status: InvestmentStatus;
  
  // Auditoria
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  
  // Relacionamentos
  dividends?: Dividend[];
  priceHistory?: InvestmentPriceHistory[];
}

export interface Dividend {
  id: string;
  investmentId: string;
  userId: string;
  
  type: DividendType;
  grossAmount: Decimal;
  taxAmount: Decimal;
  netAmount: Decimal;
  
  paymentDate: Date;
  exDate?: Date;
  
  description?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  investment?: Investment;
}

export interface InvestmentPriceHistory {
  id: string;
  investmentId: string;
  userId: string;
  
  date: Date;
  price: Decimal;
  source?: string;
  
  createdAt: Date;
}

export interface InvestmentGoal {
  id: string;
  userId: string;
  
  name: string;
  targetAmount: Decimal;
  currentAmount: Decimal;
  deadline: Date;
  
  monthlyContribution: Decimal;
  expectedReturn: Decimal;
  riskProfile: RiskProfile;
  
  fixedIncomePercent: number;
  stocksPercent: number;
  reitsPercent: number;
  cryptoPercent: number;
  internationalPercent: number;
  
  status: string;
  priority: number;
  
  description?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentEvent {
  id: string;
  userId: string;
  investmentId?: string;
  
  type: InvestmentEventType;
  title: string;
  description?: string;
  amount?: Decimal;
  date: Date;
  
  status: string;
  notified: boolean;
  notifiedAt?: Date;
  
  metadata?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DTOs
// ============================================

export interface CreateInvestmentDTO {
  userId: string;
  ticker: string;
  name: string;
  type: InvestmentType;
  category?: InvestmentCategory;
  quantity: number;
  averagePrice: number;
  purchaseDate: Date;
  broker?: string;
  brokerageFee?: number;
  otherFees?: number;
  notes?: string;
  
  // Renda Fixa
  interestRate?: number;
  indexer?: string;
  maturityDate?: Date;
  liquidity?: string;
  
  // Configurações
  createTransaction?: boolean;
  accountId?: string;
}

export interface UpdateInvestmentDTO {
  ticker?: string;
  name?: string;
  quantity?: number;
  averagePrice?: number;
  currentPrice?: number;
  broker?: string;
  notes?: string;
  status?: InvestmentStatus;
  
  // Renda Fixa
  interestRate?: number;
  indexer?: string;
  maturityDate?: Date;
  liquidity?: string;
}

export interface CreateDividendDTO {
  investmentId: string;
  userId: string;
  type: DividendType;
  grossAmount: number;
  taxAmount?: number;
  paymentDate: Date;
  exDate?: Date;
  description?: string;
  notes?: string;
  createTransaction?: boolean;
  accountId?: string;
}

export interface UpdatePriceDTO {
  investmentId: string;
  newPrice: number;
  date?: Date;
  source?: string;
}

// ============================================
// PORTFOLIO
// ============================================

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  monthlyDividends: number;
  dividendYield: number;
  
  allocation: AllocationData;
  investments: Investment[];
}

export interface AllocationData {
  [InvestmentType.FIXED_INCOME]: AllocationItem;
  [InvestmentType.STOCK]: AllocationItem;
  [InvestmentType.REIT]: AllocationItem;
  [InvestmentType.CRYPTO]: AllocationItem;
  [InvestmentType.INTERNATIONAL]: AllocationItem;
  [InvestmentType.PENSION]: AllocationItem;
  [InvestmentType.OTHER]: AllocationItem;
}

export interface AllocationItem {
  value: number;
  percent: number;
  count: number;
}

export interface PerformanceData {
  annualReturn: number;
  monthlyReturn: number;
  cdiBenchmark: number;
  ibovBenchmark: number;
  ipcaBenchmark: number;
  evolution: EvolutionPoint[];
  performanceByType: Record<InvestmentType, TypePerformance>;
}

export interface EvolutionPoint {
  date: Date;
  value: number;
  invested: number;
  profit: number;
}

export interface TypePerformance {
  return: number;
  benchmark: number;
  diff: number;
}

// ============================================
// REBALANCING
// ============================================

export interface RebalancingSuggestion {
  type: InvestmentType;
  action: 'BUY' | 'SELL' | 'HOLD';
  currentPercent: number;
  targetPercent: number;
  diff: number;
  amount: number;
  reason: string;
}

export interface IdealAllocation {
  [InvestmentType.FIXED_INCOME]: number;
  [InvestmentType.STOCK]: number;
  [InvestmentType.REIT]: number;
  [InvestmentType.CRYPTO]: number;
  [InvestmentType.INTERNATIONAL]: number;
  [InvestmentType.PENSION]: number;
  [InvestmentType.OTHER]: number;
}

// ============================================
// TAX CALCULATION
// ============================================

export interface TaxCalculation {
  stockTax: TaxDetail;
  fixedIncomeTax: TaxDetail;
  reitTax: TaxDetail;
  cryptoTax: TaxDetail;
  total: number;
}

export interface TaxDetail {
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  alreadyPaid: number;
  toPay: number;
  dueDate?: Date;
}

// ============================================
// SIMULATION
// ============================================

export interface InvestmentSimulation {
  initialAmount: number;
  monthlyContribution: number;
  months: number;
  annualReturn: number;
  
  finalValue: number;
  totalInvested: number;
  totalReturn: number;
  returnPercent: number;
  
  evolution: SimulationPoint[];
}

export interface SimulationPoint {
  month: number;
  invested: number;
  value: number;
  return: number;
}

// ============================================
// FILTERS
// ============================================

export interface InvestmentFilters {
  type?: InvestmentType;
  category?: InvestmentCategory;
  status?: InvestmentStatus;
  broker?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================
// CONSTANTS
// ============================================

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  [InvestmentType.FIXED_INCOME]: 'Renda Fixa',
  [InvestmentType.STOCK]: 'Ações',
  [InvestmentType.REIT]: 'FIIs',
  [InvestmentType.CRYPTO]: 'Criptomoedas',
  [InvestmentType.INTERNATIONAL]: 'Internacional',
  [InvestmentType.PENSION]: 'Previdência',
  [InvestmentType.OTHER]: 'Outros'
};

export const DIVIDEND_TYPE_LABELS: Record<DividendType, string> = {
  [DividendType.DIVIDEND]: 'Dividendo',
  [DividendType.JCP]: 'JCP',
  [DividendType.INCOME]: 'Rendimento',
  [DividendType.INTEREST]: 'Juros'
};

export const RISK_PROFILE_LABELS: Record<RiskProfile, string> = {
  [RiskProfile.CONSERVATIVE]: 'Conservador',
  [RiskProfile.MODERATE]: 'Moderado',
  [RiskProfile.AGGRESSIVE]: 'Arrojado'
};

export const IDEAL_ALLOCATIONS: Record<RiskProfile, IdealAllocation> = {
  [RiskProfile.CONSERVATIVE]: {
    [InvestmentType.FIXED_INCOME]: 70,
    [InvestmentType.STOCK]: 15,
    [InvestmentType.REIT]: 10,
    [InvestmentType.CRYPTO]: 0,
    [InvestmentType.INTERNATIONAL]: 5,
    [InvestmentType.PENSION]: 0,
    [InvestmentType.OTHER]: 0
  },
  [RiskProfile.MODERATE]: {
    [InvestmentType.FIXED_INCOME]: 50,
    [InvestmentType.STOCK]: 30,
    [InvestmentType.REIT]: 15,
    [InvestmentType.CRYPTO]: 0,
    [InvestmentType.INTERNATIONAL]: 5,
    [InvestmentType.PENSION]: 0,
    [InvestmentType.OTHER]: 0
  },
  [RiskProfile.AGGRESSIVE]: {
    [InvestmentType.FIXED_INCOME]: 30,
    [InvestmentType.STOCK]: 40,
    [InvestmentType.REIT]: 15,
    [InvestmentType.CRYPTO]: 5,
    [InvestmentType.INTERNATIONAL]: 10,
    [InvestmentType.PENSION]: 0,
    [InvestmentType.OTHER]: 0
  }
};

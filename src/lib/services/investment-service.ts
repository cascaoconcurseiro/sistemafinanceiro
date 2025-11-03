// ============================================
// INVESTMENT SERVICE
// Serviço completo de gestão de investimentos
// ============================================

import { db } from '@/lib/db';
import {
  Investment,
  CreateInvestmentDTO,
  UpdateInvestmentDTO,
  CreateDividendDTO,
  UpdatePriceDTO,
  PortfolioSummary,
  PerformanceData,
  RebalancingSuggestion,
  TaxCalculation,
  InvestmentSimulation,
  InvestmentType,
  RiskProfile,
  IDEAL_ALLOCATIONS,
  AllocationData,
  AllocationItem
} from '@/types/investment';
import { Decimal } from '@prisma/client/runtime/library';

export class InvestmentService {

  // ============================================
  // CRUD BÁSICO
  // ============================================

  async create(data: CreateInvestmentDTO): Promise<Investment> {
    return await db.$transaction(async (tx) => {
      // Calcular valores
      const totalInvested = data.quantity * data.averagePrice +
                           (data.brokerageFee || 0) +
                           (data.otherFees || 0);

      const currentValue = data.quantity * data.averagePrice;

      // Criar investimento
      const investment = await tx.investment.create({
        data: {
          userId: data.userId,
          ticker: data.ticker,
          name: data.name,
          type: data.type,
          category: data.category,
          quantity: new Decimal(data.quantity),
          averagePrice: new Decimal(data.averagePrice),
          purchasePrice: new Decimal(data.averagePrice),
          currentPrice: new Decimal(data.averagePrice),
          totalInvested: new Decimal(totalInvested),
          currentValue: new Decimal(currentValue),
          brokerageFee: new Decimal(data.brokerageFee || 0),
          otherFees: new Decimal(data.otherFees || 0),
          fees: new Decimal((data.brokerageFee || 0) + (data.otherFees || 0)),
          profitLoss: new Decimal(0),
          profitLossPercent: new Decimal(0),
          broker: data.broker,
          purchaseDate: data.purchaseDate,
          notes: data.notes,
          status: 'active',

          // Renda Fixa
          interestRate: data.interestRate ? new Decimal(data.interestRate) : null,
          indexer: data.indexer,
          maturityDate: data.maturityDate,
          liquidity: data.liquidity,
        }
      });

      // Criar histórico de preço inicial
      await tx.investmentPriceHistory.create({
        data: {
          investmentId: investment.id,
          userId: data.userId,
          date: data.purchaseDate,
          price: new Decimal(data.averagePrice),
          source: 'manual'
        }
      });

      // Se marcou para criar transação
      if (data.createTransaction && data.accountId) {
        await tx.transaction.create({
          data: {
            userId: data.userId,
            accountId: data.accountId,
            investmentId: investment.id,
            type: 'DESPESA',
            amount: new Decimal(totalInvested),
            description: `Compra de ${data.ticker} - ${data.name}`,
            date: data.purchaseDate,
            status: 'cleared',
            categoryId: null, // Criar categoria "Investimentos"
          }
        });
      }

      return investment as Investment;
    });
  }

  async update(id: string, data: UpdateInvestmentDTO): Promise<Investment> {
    const investment = await db.investment.findUnique({ where: { id } });
    if (!investment) throw new Error('Investment not found');

    // Recalcular valores se necessário
    let updateData: any = { ...data };

    if (data.currentPrice) {
      const currentValue = Number(investment.quantity) * data.currentPrice;
      const profitLoss = currentValue - Number(investment.totalInvested);
      const profitLossPercent = (profitLoss / Number(investment.totalInvested)) * 100;

      updateData = {
        ...updateData,
        currentPrice: new Decimal(data.currentPrice),
        currentValue: new Decimal(currentValue),
        profitLoss: new Decimal(profitLoss),
        profitLossPercent: new Decimal(profitLossPercent),
      };
    }

    return await db.investment.update({
      where: { id },
      data: updateData
    }) as Investment;
  }

  async delete(id: string): Promise<void> {
    await db.investment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async findById(id: string): Promise<Investment | null> {
    return await db.investment.findUnique({
      where: { id },
      include: {
        dividends: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    }) as Investment | null;
  }

  async findByUserId(userId: string): Promise<Investment[]> {
    return await db.investment.findMany({
      where: {
        userId,
        deletedAt: null
      },
      include: {
        dividends: true
      },
      orderBy: { createdAt: 'desc' }
    }) as Investment[];
  }

  // ============================================
  // ATUALIZAÇÃO DE PREÇOS
  // ============================================

  async updatePrice(data: UpdatePriceDTO): Promise<Investment> {
    const investment = await db.investment.findUnique({
      where: { id: data.investmentId }
    });

    if (!investment) throw new Error('Investment not found');

    return await db.$transaction(async (tx) => {
      // Calcular novos valores
      const currentValue = Number(investment.quantity) * data.newPrice;
      const profitLoss = currentValue - Number(investment.totalInvested);
      const profitLossPercent = (profitLoss / Number(investment.totalInvested)) * 100;

      // Atualizar investimento
      const updated = await tx.investment.update({
        where: { id: data.investmentId },
        data: {
          currentPrice: new Decimal(data.newPrice),
          currentValue: new Decimal(currentValue),
          profitLoss: new Decimal(profitLoss),
          profitLossPercent: new Decimal(profitLossPercent),
        }
      });

      // Adicionar ao histórico
      await tx.investmentPriceHistory.create({
        data: {
          investmentId: data.investmentId,
          userId: investment.userId,
          date: data.date || new Date(),
          price: new Decimal(data.newPrice),
          source: data.source || 'manual'
        }
      });

      return updated as Investment;
    });
  }

  async updateMultiplePrices(updates: UpdatePriceDTO[]): Promise<Investment[]> {
    const results: Investment[] = [];

    for (const update of updates) {
      const result = await this.updatePrice(update);
      results.push(result);
    }

    return results;
  }

  // ============================================
  // DIVIDENDOS
  // ============================================

  async createDividend(data: CreateDividendDTO) {
    return await db.$transaction(async (tx) => {
      const netAmount = data.grossAmount - (data.taxAmount || 0);

      // Criar dividendo
      const dividend = await tx.dividend.create({
        data: {
          investmentId: data.investmentId,
          userId: data.userId,
          type: data.type,
          grossAmount: new Decimal(data.grossAmount),
          taxAmount: new Decimal(data.taxAmount || 0),
          netAmount: new Decimal(netAmount),
          paymentDate: data.paymentDate,
          exDate: data.exDate,
          description: data.description,
          notes: data.notes,
        }
      });

      // Atualizar último dividendo do investimento
      await tx.investment.update({
        where: { id: data.investmentId },
        data: {
          lastDividend: new Decimal(netAmount),
          lastDividendDate: data.paymentDate,
        }
      });

      // Se marcou para criar transação
      if (data.createTransaction && data.accountId) {
        await tx.transaction.create({
          data: {
            userId: data.userId,
            accountId: data.accountId,
            investmentId: data.investmentId,
            type: 'RECEITA',
            amount: new Decimal(netAmount),
            description: `${data.type} - ${data.description || 'Dividendo'}`,
            date: data.paymentDate,
            status: 'cleared',
          }
        });
      }

      return dividend;
    });
  }

  async getDividendsByInvestment(investmentId: string) {
    return await db.dividend.findMany({
      where: { investmentId },
      orderBy: { paymentDate: 'desc' }
    });
  }

  async getDividendsByUser(userId: string, year?: number) {
    const where: any = { userId };

    if (year) {
      where.paymentDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`)
      };
    }

    return await db.dividend.findMany({
      where,
      include: { investment: true },
      orderBy: { paymentDate: 'desc' }
    });
  }

  // ============================================
  // PORTFOLIO
  // ============================================

  async getPortfolio(userId: string): Promise<PortfolioSummary> {
    const investments = await this.findByUserId(userId);

    // Calcular totais
    const totalValue = investments.reduce((sum, inv) =>
      sum + Number(inv.currentValue), 0
    );

    const totalInvested = investments.reduce((sum, inv) =>
      sum + Number(inv.totalInvested), 0
    );

    const profitLoss = totalValue - totalInvested;
    const profitLossPercent = totalInvested > 0
      ? (profitLoss / totalInvested) * 100
      : 0;

    // Calcular mudança mensal (simplificado - comparar com mês anterior)
    const monthlyChange = 0; // TODO: Implementar comparação com histórico
    const monthlyChangePercent = 0;

    // Calcular dividendos mensais
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const dividends = await db.dividend.findMany({
      where: {
        userId,
        paymentDate: { gte: lastMonth }
      }
    });

    const monthlyDividends = dividends.reduce((sum, div) =>
      sum + Number(div.netAmount), 0
    );

    const dividendYield = totalValue > 0
      ? (monthlyDividends * 12 / totalValue) * 100
      : 0;

    // Calcular alocação
    const allocation = this.calculateAllocation(investments, totalValue);

    return {
      totalValue,
      totalInvested,
      profitLoss,
      profitLossPercent,
      monthlyChange,
      monthlyChangePercent,
      monthlyDividends,
      dividendYield,
      allocation,
      investments
    };
  }

  private calculateAllocation(investments: Investment[], totalValue: number): AllocationData {
    const allocation: any = {};

    // Inicializar todos os tipos
    Object.values(InvestmentType).forEach(type => {
      allocation[type] = {
        value: 0,
        percent: 0,
        count: 0
      };
    });

    // Calcular por tipo
    investments.forEach(inv => {
      const value = Number(inv.currentValue);
      allocation[inv.type].value += value;
      allocation[inv.type].count += 1;
    });

    // Calcular percentuais
    Object.keys(allocation).forEach(type => {
      allocation[type].percent = totalValue > 0
        ? (allocation[type].value / totalValue) * 100
        : 0;
    });

    return allocation as AllocationData;
  }

  // ============================================
  // PERFORMANCE
  // ============================================

  async getPerformance(userId: string): Promise<PerformanceData> {
    const investments = await this.findByUserId(userId);

    // Calcular retorno anual (simplificado)
    const totalValue = investments.reduce((sum, inv) =>
      sum + Number(inv.currentValue), 0
    );
    const totalInvested = investments.reduce((sum, inv) =>
      sum + Number(inv.totalInvested), 0
    );

    const annualReturn = totalInvested > 0
      ? ((totalValue - totalInvested) / totalInvested) * 100
      : 0;

    // Benchmarks (valores fixos - em produção, buscar de API)
    const cdiBenchmark = 10.4;
    const ibovBenchmark = 8.2;
    const ipcaBenchmark = 4.5;

    // Evolução (simplificado - últimos 12 meses)
    const evolution = await this.getEvolution(userId, 12);

    // Performance por tipo
    const performanceByType: any = {};
    Object.values(InvestmentType).forEach(type => {
      const typeInvestments = investments.filter(inv => inv.type === type);
      const typeValue = typeInvestments.reduce((sum, inv) =>
        sum + Number(inv.currentValue), 0
      );
      const typeInvested = typeInvestments.reduce((sum, inv) =>
        sum + Number(inv.totalInvested), 0
      );

      const typeReturn = typeInvested > 0
        ? ((typeValue - typeInvested) / typeInvested) * 100
        : 0;

      performanceByType[type] = {
        return: typeReturn,
        benchmark: this.getBenchmarkForType(type),
        diff: typeReturn - this.getBenchmarkForType(type)
      };
    });

    return {
      annualReturn,
      monthlyReturn: annualReturn / 12,
      cdiBenchmark,
      ibovBenchmark,
      ipcaBenchmark,
      evolution,
      performanceByType
    };
  }

  private getBenchmarkForType(type: InvestmentType): number {
    const benchmarks: Record<InvestmentType, number> = {
      [InvestmentType.FIXED_INCOME]: 10.4, // CDI
      [InvestmentType.STOCK]: 8.2,         // Ibovespa
      [InvestmentType.REIT]: 6.4,          // IFIX
      [InvestmentType.CRYPTO]: 0,          // Volátil
      [InvestmentType.INTERNATIONAL]: 7.5, // S&P500
      [InvestmentType.PENSION]: 9.0,       // Média
      [InvestmentType.OTHER]: 0
    };

    return benchmarks[type] || 0;
  }

  private async getEvolution(userId: string, months: number) {
    // Simplificado - em produção, buscar histórico real
    const evolution = [];
    const now = new Date();

    for (let i = months; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      evolution.push({
        date,
        value: 100000 + (i * 5000), // Mock
        invested: 100000,
        profit: i * 5000
      });
    }

    return evolution;
  }

  // ============================================
  // REBALANCEAMENTO
  // ============================================

  async suggestRebalancing(
    userId: string,
    riskProfile: RiskProfile
  ): Promise<RebalancingSuggestion[]> {
    const portfolio = await this.getPortfolio(userId);
    const idealAllocation = IDEAL_ALLOCATIONS[riskProfile];

    const suggestions: RebalancingSuggestion[] = [];

    Object.entries(idealAllocation).forEach(([type, idealPercent]) => {
      const currentPercent = portfolio.allocation[type as InvestmentType].percent;
      const diff = idealPercent - currentPercent;

      if (Math.abs(diff) > 5) { // Diferença > 5%
        suggestions.push({
          type: type as InvestmentType,
          action: diff > 0 ? 'BUY' : 'SELL',
          currentPercent,
          targetPercent: idealPercent,
          diff,
          amount: (portfolio.totalValue * Math.abs(diff)) / 100,
          reason: `Rebalancear para ${idealPercent}%`
        });
      }
    });

    return suggestions;
  }

  // ============================================
  // CÁLCULO DE IR
  // ============================================

  async calculateTax(userId: string, year: number): Promise<TaxCalculation> {
    const investments = await this.findByUserId(userId);
    const dividends = await this.getDividendsByUser(userId, year);

    // Ações (15% sobre lucro em vendas > R$ 20k/mês)
    const stockTax = this.calculateStockTax(investments);

    // Renda Fixa (15-22.5% conforme prazo)
    const fixedIncomeTax = this.calculateFixedIncomeTax(investments);

    // FIIs (20% sobre dividendos)
    const reitTax = this.calculateReitTax(dividends);

    // Cripto (15% sobre lucro)
    const cryptoTax = this.calculateCryptoTax(investments);

    return {
      stockTax,
      fixedIncomeTax,
      reitTax,
      cryptoTax,
      total: stockTax.toPay + fixedIncomeTax.toPay + reitTax.toPay + cryptoTax.toPay
    };
  }

  private calculateStockTax(investments: Investment[]) {
    // Simplificado - em produção, considerar vendas mensais
    const stocks = investments.filter(inv => inv.type === InvestmentType.STOCK);
    const profit = stocks.reduce((sum, inv) => sum + Number(inv.profitLoss), 0);

    return {
      taxableAmount: profit > 0 ? profit : 0,
      taxRate: 15,
      taxAmount: profit > 0 ? profit * 0.15 : 0,
      alreadyPaid: 0,
      toPay: profit > 0 ? profit * 0.15 : 0,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    };
  }

  private calculateFixedIncomeTax(investments: Investment[]) {
    // Simplificado
    return {
      taxableAmount: 0,
      taxRate: 15,
      taxAmount: 0,
      alreadyPaid: 0,
      toPay: 0
    };
  }

  private calculateReitTax(dividends: any[]) {
    const reitDividends = dividends.filter(d =>
      d.investment?.type === InvestmentType.REIT
    );
    const total = reitDividends.reduce((sum, d) => sum + Number(d.grossAmount), 0);
    const taxPaid = reitDividends.reduce((sum, d) => sum + Number(d.taxAmount), 0);

    return {
      taxableAmount: total,
      taxRate: 20,
      taxAmount: total * 0.2,
      alreadyPaid: taxPaid,
      toPay: 0 // Já retido na fonte
    };
  }

  private calculateCryptoTax(investments: Investment[]) {
    const crypto = investments.filter(inv => inv.type === InvestmentType.CRYPTO);
    const profit = crypto.reduce((sum, inv) => sum + Number(inv.profitLoss), 0);

    return {
      taxableAmount: profit > 0 ? profit : 0,
      taxRate: 15,
      taxAmount: profit > 0 ? profit * 0.15 : 0,
      alreadyPaid: 0,
      toPay: profit > 0 ? profit * 0.15 : 0
    };
  }

  // ============================================
  // SIMULAÇÃO
  // ============================================

  simulate(
    initialAmount: number,
    monthlyContribution: number,
    months: number,
    annualReturn: number
  ): InvestmentSimulation {
    const monthlyReturn = annualReturn / 12 / 100;
    const evolution = [];

    let value = initialAmount;
    let invested = initialAmount;

    for (let month = 0; month <= months; month++) {
      if (month > 0) {
        value = value * (1 + monthlyReturn) + monthlyContribution;
        invested += monthlyContribution;
      }

      evolution.push({
        month,
        invested,
        value,
        return: value - invested
      });
    }

    const finalValue = value;
    const totalInvested = invested;
    const totalReturn = finalValue - totalInvested;
    const returnPercent = (totalReturn / totalInvested) * 100;

    return {
      initialAmount,
      monthlyContribution,
      months,
      annualReturn,
      finalValue,
      totalInvested,
      totalReturn,
      returnPercent,
      evolution
    };
  }
}

export const investmentService = new InvestmentService();

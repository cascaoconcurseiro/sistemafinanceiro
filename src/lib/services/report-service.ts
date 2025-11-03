/**
 * SERVIÇO DE RELATÓRIOS AVANÇADOS
 * Gera relatórios contábeis profissionais
 */

import { prisma } from '@/lib/prisma';

export class ReportService {
  /**
   * DRE - Demonstração do Resultado do Exercício
   */
  static async generateDRE(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      include: {
        categoryRef: true
      }
    });

    // Receitas
    const revenues = transactions.filter(t => Number(t.amount) > 0);
    const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);

    // Despesas
    const expenses = transactions.filter(t => Number(t.amount) < 0);
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + Number(t.amount), 0));

    // Agrupar despesas por categoria
    const expensesByCategory = new Map<string, number>();
    expenses.forEach(t => {
      const category = t.categoryRef?.name || 'Sem Categoria';
      const current = expensesByCategory.get(category) || 0;
      expensesByCategory.set(category, current + Math.abs(Number(t.amount)));
    });

    // Resultado
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return {
      period: {
        start: startDate,
        end: endDate
      },
      revenue: {
        total: totalRevenue,
        transactions: revenues.length
      },
      expenses: {
        total: totalExpenses,
        transactions: expenses.length,
        byCategory: Object.fromEntries(expensesByCategory)
      },
      result: {
        netIncome,
        profitMargin,
        status: netIncome >= 0 ? 'profit' : 'loss'
      }
    };
  }

  /**
   * Balanço Patrimonial
   */
  static async generateBalanceSheet(userId: string, date: Date = new Date()) {
    // Ativos
    const assets = await prisma.account.findMany({
      where: {
        userId,
        type: 'ATIVO',
        deletedAt: null
      }
    });

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);

    // Passivos
    const liabilities = await prisma.account.findMany({
      where: {
        userId,
        type: 'PASSIVO',
        deletedAt: null
      }
    });

    const totalLiabilities = liabilities.reduce((sum, l) => sum + Math.abs(Number(l.balance)), 0);

    // Patrimônio Líquido
    const equity = totalAssets - totalLiabilities;

    // Cartões de crédito (passivo)
    const creditCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true }
    });

    const totalCreditCardDebt = creditCards.reduce((sum, c) => sum + Number(c.currentBalance), 0);

    return {
      date,
      assets: {
        accounts: assets.map(a => ({
          name: a.name,
          balance: Number(a.balance)
        })),
        total: totalAssets
      },
      liabilities: {
        accounts: liabilities.map(l => ({
          name: l.name,
          balance: Math.abs(Number(l.balance))
        })),
        creditCards: creditCards.map(c => ({
          name: c.name,
          balance: Number(c.currentBalance)
        })),
        total: totalLiabilities + totalCreditCardDebt
      },
      equity: {
        total: equity,
        percentOfAssets: totalAssets > 0 ? (equity / totalAssets) * 100 : 0
      }
    };
  }

  /**
   * Análise de Categorias
   */
  static async analyzeCategoriesExpenses(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        deletedAt: null,
        amount: { lt: 0 }
      },
      include: {
        categoryRef: true
      }
    });

    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + Number(t.amount), 0));

    // Agrupar por categoria
    const byCategory = new Map<string, { total: number; count: number; transactions: any[] }>();

    expenses.forEach(t => {
      const category = t.categoryRef?.name || 'Sem Categoria';
      const current = byCategory.get(category) || { total: 0, count: 0, transactions: [] };
      
      current.total += Math.abs(Number(t.amount));
      current.count += 1;
      current.transactions.push(t);
      
      byCategory.set(category, current);
    });

    // Calcular percentuais e ordenar
    const categories = Array.from(byCategory.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        average: data.total / data.count,
        percent: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Top 5 categorias
    const top5 = categories.slice(0, 5);
    const top5Total = top5.reduce((sum, c) => sum + c.total, 0);
    const top5Percent = totalExpenses > 0 ? (top5Total / totalExpenses) * 100 : 0;

    return {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalExpenses,
        totalTransactions: expenses.length,
        categoriesCount: categories.length
      },
      categories,
      top5: {
        categories: top5,
        total: top5Total,
        percent: top5Percent
      }
    };
  }

  /**
   * Análise de Tendências
   */
  static async analyzeTrends(
    userId: string,
    months: number = 6
  ) {
    const trends: Array<{
      period: string;
      revenue: number;
      expenses: number;
      balance: number;
    }> = [];

    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          deletedAt: null
        }
      });

      const revenue = transactions
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = Math.abs(transactions
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Number(t.amount), 0));

      trends.push({
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        revenue,
        expenses,
        balance: revenue - expenses
      });
    }

    // Calcular médias
    const avgRevenue = trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length;
    const avgExpenses = trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length;
    const avgBalance = trends.reduce((sum, t) => sum + t.balance, 0) / trends.length;

    // Tendência (último mês vs média)
    const lastMonth = trends[trends.length - 1];
    const revenueTrend = lastMonth.revenue > avgRevenue ? 'up' : 'down';
    const expensesTrend = lastMonth.expenses > avgExpenses ? 'up' : 'down';

    return {
      months,
      trends,
      averages: {
        revenue: avgRevenue,
        expenses: avgExpenses,
        balance: avgBalance
      },
      lastMonth: {
        ...lastMonth,
        revenueTrend,
        expensesTrend
      }
    };
  }

  /**
   * Relatório Completo
   */
  static async generateCompleteReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const [dre, balanceSheet, categories, trends] = await Promise.all([
      this.generateDRE(userId, startDate, endDate),
      this.generateBalanceSheet(userId, endDate),
      this.analyzeCategoriesExpenses(userId, startDate, endDate),
      this.analyzeTrends(userId, 6)
    ]);

    return {
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate
      },
      dre,
      balanceSheet,
      categories,
      trends
    };
  }
}

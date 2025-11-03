/**
 * CALCULADORA DE ORÇAMENTOS
 * Recalcula gastos de orçamentos por categoria
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BudgetCalculator {
  /**
   * Recalcula o total gasto em um orçamento específico
   */
  static async recalculateBudgetSpent(
    tx: Prisma.TransactionClient,
    budgetId: string
  ): Promise<void> {
    // Buscar orçamento
    const budget = await tx.budget.findUnique({
      where: { id: budgetId },
      select: {
        categoryId: true,
        startDate: true,
        endDate: true,
        userId: true,
      },
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    // Buscar todas as transações da categoria no período
    const transactions = await tx.transaction.findMany({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        type: 'DESPESA',
        status: { not: 'CANCELLED' },
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: { amount: true },
    });

    // Calcular total gasto
    const spent = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // Atualizar orçamento
    await tx.budget.update({
      where: { id: budgetId },
      data: { spent },
    });
  }

  /**
   * Recalcula todos os orçamentos de um usuário
   */
  static async recalculateAllBudgets(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const budgets = await tx.budget.findMany({
        where: { userId },
        select: { id: true },
      });

      for (const budget of budgets) {
        await this.recalculateBudgetSpent(tx, budget.id);
      }
    });
  }

  /**
   * Verifica se um orçamento está consistente
   */
  static async checkBudgetConsistency(budgetId: string): Promise<{
    isConsistent: boolean;
    currentSpent: number;
    calculatedSpent: number;
    difference: number;
    amount: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
  }> {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      select: {
        spent: true,
        amount: true,
        categoryId: true,
        startDate: true,
        endDate: true,
        userId: true,
      },
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        type: 'DESPESA',
        status: { not: 'CANCELLED' },
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: { amount: true },
    });

    const calculatedSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    const currentSpent = Number(budget.spent);
    const amount = Number(budget.amount);
    const difference = Math.abs(currentSpent - calculatedSpent);
    const isConsistent = difference < 0.01; // Tolerância de 1 centavo
    const remaining = amount - calculatedSpent;
    const percentageUsed = amount > 0 ? (calculatedSpent / amount) * 100 : 0;
    const isOverBudget = calculatedSpent > amount;

    return {
      isConsistent,
      currentSpent,
      calculatedSpent,
      difference,
      amount,
      remaining,
      percentageUsed,
      isOverBudget,
    };
  }

  /**
   * Calcula estatísticas de um orçamento
   */
  static async getBudgetStatistics(budgetId: string): Promise<{
    spent: number;
    amount: number;
    remaining: number;
    percentageUsed: number;
    transactionCount: number;
    averageTransaction: number;
    largestTransaction: number;
    smallestTransaction: number;
    daysElapsed: number;
    daysRemaining: number;
    dailyAverage: number;
    projectedTotal: number;
    isOnTrack: boolean;
  }> {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      select: {
        spent: true,
        amount: true,
        categoryId: true,
        startDate: true,
        endDate: true,
        userId: true,
      },
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        type: 'DESPESA',
        status: { not: 'CANCELLED' },
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: { amount: true },
    });

    const amounts = transactions.map((t) => Math.abs(Number(t.amount)));
    const spent = amounts.reduce((sum, amount) => sum + amount, 0);
    const amount = Number(budget.amount);
    const remaining = amount - spent;
    const percentageUsed = amount > 0 ? (spent / amount) * 100 : 0;
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? spent / transactionCount : 0;
    const largestTransaction = amounts.length > 0 ? Math.max(...amounts) : 0;
    const smallestTransaction = amounts.length > 0 ? Math.min(...amounts) : 0;

    // Calcular dias
    const now = new Date();
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular médias e projeções
    const dailyAverage = daysElapsed > 0 ? spent / daysElapsed : 0;
    const projectedTotal = dailyAverage * totalDays;
    const expectedSpent = (amount * daysElapsed) / totalDays;
    const isOnTrack = spent <= expectedSpent;

    return {
      spent,
      amount,
      remaining,
      percentageUsed,
      transactionCount,
      averageTransaction,
      largestTransaction,
      smallestTransaction,
      daysElapsed,
      daysRemaining,
      dailyAverage,
      projectedTotal,
      isOnTrack,
    };
  }

  /**
   * Calcula gastos diários de um orçamento
   */
  static async getBudgetDailyExpenses(budgetId: string): Promise<
    Array<{
      date: string;
      total: number;
      transactionCount: number;
      cumulativeTotal: number;
    }>
  > {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      select: {
        categoryId: true,
        startDate: true,
        endDate: true,
        userId: true,
      },
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: budget.userId,
        categoryId: budget.categoryId,
        type: 'DESPESA',
        status: { not: 'CANCELLED' },
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      select: {
        date: true,
        amount: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Agrupar por dia
    const byDay = transactions.reduce((acc, t) => {
      const dateKey = t.date.toISOString().split('T')[0];
      const amount = Math.abs(Number(t.amount));

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          total: 0,
          transactionCount: 0,
        };
      }

      acc[dateKey].total += amount;
      acc[dateKey].transactionCount += 1;

      return acc;
    }, {} as Record<string, any>);

    // Adicionar total cumulativo
    const dailyExpenses = Object.values(byDay);
    let cumulativeTotal = 0;

    return dailyExpenses.map((day: any) => {
      cumulativeTotal += day.total;
      return {
        ...day,
        cumulativeTotal,
      };
    });
  }

  /**
   * Verifica se orçamento foi excedido e retorna alertas
   */
  static async checkBudgetAlerts(budgetId: string): Promise<{
    isOverBudget: boolean;
    isNearLimit: boolean; // 80% ou mais
    isCritical: boolean; // 95% ou mais
    percentageUsed: number;
    remaining: number;
    message: string;
  }> {
    const stats = await this.checkBudgetConsistency(budgetId);

    const isOverBudget = stats.isOverBudget;
    const isNearLimit = stats.percentageUsed >= 80;
    const isCritical = stats.percentageUsed >= 95;

    let message = '';
    if (isOverBudget) {
      message = `Orçamento excedido em R$ ${Math.abs(stats.remaining).toFixed(2)}`;
    } else if (isCritical) {
      message = `Atenção! Apenas R$ ${stats.remaining.toFixed(2)} restantes (${(100 - stats.percentageUsed).toFixed(1)}%)`;
    } else if (isNearLimit) {
      message = `Cuidado! ${stats.percentageUsed.toFixed(1)}% do orçamento já foi usado`;
    } else {
      message = `Orçamento sob controle. ${stats.percentageUsed.toFixed(1)}% usado`;
    }

    return {
      isOverBudget,
      isNearLimit,
      isCritical,
      percentageUsed: stats.percentageUsed,
      remaining: stats.remaining,
      message,
    };
  }
}

/**
 * CALCULADORA DE VIAGENS
 * Recalcula gastos de viagens
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TripCalculator {
  /**
   * Recalcula o total gasto em uma viagem específica
   */
  static async recalculateTripSpent(
    tx: Prisma.TransactionClient,
    tripId: string
  ): Promise<void> {
    // Buscar todas as transações da viagem
    const transactions = await tx.transaction.findMany({
      where: {
        tripId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      select: { amount: true },
    });

    // Calcular total gasto
    const totalSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // Atualizar viagem
    await tx.trip.update({
      where: { id: tripId },
      data: { spent: totalSpent },
    });
  }

  /**
   * Recalcula todas as viagens de um usuário
   */
  static async recalculateAllTrips(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const trips = await tx.trip.findMany({
        where: { userId },
        select: { id: true },
      });

      for (const trip of trips) {
        await this.recalculateTripSpent(tx, trip.id);
      }
    });
  }

  /**
   * Verifica se uma viagem está consistente
   */
  static async checkTripConsistency(tripId: string): Promise<{
    isConsistent: boolean;
    currentSpent: number;
    calculatedSpent: number;
    difference: number;
    budget: number;
    isOverBudget: boolean;
  }> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { spent: true, budget: true },
    });

    if (!trip) {
      throw new Error('Viagem não encontrada');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        tripId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      select: { amount: true },
    });

    const calculatedSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    const currentSpent = Number(trip.spent);
    const budget = Number(trip.budget);
    const difference = Math.abs(currentSpent - calculatedSpent);
    const isConsistent = difference < 0.01; // Tolerância de 1 centavo
    const isOverBudget = calculatedSpent > budget;

    return {
      isConsistent,
      currentSpent,
      calculatedSpent,
      difference,
      budget,
      isOverBudget,
    };
  }

  /**
   * Calcula estatísticas de uma viagem
   */
  static async getTripStatistics(tripId: string): Promise<{
    totalSpent: number;
    budget: number;
    remaining: number;
    percentageUsed: number;
    transactionCount: number;
    averageTransaction: number;
    largestTransaction: number;
    smallestTransaction: number;
  }> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { spent: true, budget: true },
    });

    if (!trip) {
      throw new Error('Viagem não encontrada');
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        tripId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      select: { amount: true },
    });

    const amounts = transactions.map((t) => Math.abs(Number(t.amount)));
    const totalSpent = amounts.reduce((sum, amount) => sum + amount, 0);
    const budget = Number(trip.budget);
    const remaining = budget - totalSpent;
    const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;
    const largestTransaction = amounts.length > 0 ? Math.max(...amounts) : 0;
    const smallestTransaction = amounts.length > 0 ? Math.min(...amounts) : 0;

    return {
      totalSpent,
      budget,
      remaining,
      percentageUsed,
      transactionCount,
      averageTransaction,
      largestTransaction,
      smallestTransaction,
    };
  }

  /**
   * Calcula gastos por categoria em uma viagem
   */
  static async getTripExpensesByCategory(tripId: string): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      total: number;
      percentage: number;
      transactionCount: number;
    }>
  > {
    const transactions = await prisma.transaction.findMany({
      where: {
        tripId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
      },
      include: {
        category: true,
      },
    });

    const totalSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    // Agrupar por categoria
    const byCategory = transactions.reduce((acc, t) => {
      const categoryId = t.categoryId || 'uncategorized';
      const categoryName = t.category?.name || 'Sem Categoria';
      const amount = Math.abs(Number(t.amount));

      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName,
          total: 0,
          transactionCount: 0,
        };
      }

      acc[categoryId].total += amount;
      acc[categoryId].transactionCount += 1;

      return acc;
    }, {} as Record<string, any>);

    // Converter para array e calcular porcentagens
    return Object.values(byCategory).map((cat: any) => ({
      ...cat,
      percentage: totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0,
    }));
  }

  /**
   * Calcula gastos diários de uma viagem
   */
  static async getTripDailyExpenses(tripId: string): Promise<
    Array<{
      date: string;
      total: number;
      transactionCount: number;
    }>
  > {
    const transactions = await prisma.transaction.findMany({
      where: {
        tripId,
        status: { not: 'CANCELLED' },
        type: 'DESPESA',
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

    return Object.values(byDay);
  }
}

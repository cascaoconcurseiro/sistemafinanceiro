/**
 * CALCULADORA DE METAS
 * Recalcula progresso de metas financeiras
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class GoalCalculator {
  /**
   * Recalcula o progresso de uma meta específica
   */
  static async recalculateGoalAmount(
    tx: Prisma.TransactionClient,
    goalId: string
  ): Promise<void> {
    // Buscar todas as contribuições da meta
    const contributions = await tx.goalContribution.findMany({
      where: {
        goalId,
        status: { not: 'CANCELLED' },
      },
      select: { amount: true },
    });

    // Calcular total acumulado
    const currentAmount = contributions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    // Buscar meta para verificar se atingiu o objetivo
    const goal = await tx.goal.findUnique({
      where: { id: goalId },
      select: { targetAmount: true },
    });

    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    const targetAmount = Number(goal.targetAmount);
    const isCompleted = currentAmount >= targetAmount;

    // Atualizar meta
    await tx.goal.update({
      where: { id: goalId },
      data: {
        currentAmount,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }

  /**
   * Recalcula todas as metas de um usuário
   */
  static async recalculateAllGoals(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const goals = await tx.goal.findMany({
        where: { userId },
        select: { id: true },
      });

      for (const goal of goals) {
        await this.recalculateGoalAmount(tx, goal.id);
      }
    });
  }

  /**
   * Verifica se uma meta está consistente
   */
  static async checkGoalConsistency(goalId: string): Promise<{
    isConsistent: boolean;
    currentAmount: number;
    calculatedAmount: number;
    difference: number;
    targetAmount: number;
    percentageComplete: number;
    isCompleted: boolean;
  }> {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { currentAmount: true, targetAmount: true, status: true },
    });

    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    const contributions = await prisma.goalContribution.findMany({
      where: {
        goalId,
        status: { not: 'CANCELLED' },
      },
      select: { amount: true },
    });

    const calculatedAmount = contributions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);
    const difference = Math.abs(currentAmount - calculatedAmount);
    const isConsistent = difference < 0.01; // Tolerância de 1 centavo
    const percentageComplete = targetAmount > 0 ? (calculatedAmount / targetAmount) * 100 : 0;
    const isCompleted = calculatedAmount >= targetAmount;

    return {
      isConsistent,
      currentAmount,
      calculatedAmount,
      difference,
      targetAmount,
      percentageComplete,
      isCompleted,
    };
  }

  /**
   * Calcula estatísticas de uma meta
   */
  static async getGoalStatistics(goalId: string): Promise<{
    currentAmount: number;
    targetAmount: number;
    remaining: number;
    percentageComplete: number;
    contributionCount: number;
    averageContribution: number;
    largestContribution: number;
    smallestContribution: number;
    daysElapsed: number;
    daysRemaining: number;
    estimatedCompletionDate: Date | null;
  }> {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        currentAmount: true,
        targetAmount: true,
        deadline: true,
        createdAt: true,
      },
    });

    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    const contributions = await prisma.goalContribution.findMany({
      where: {
        goalId,
        status: { not: 'CANCELLED' },
      },
      select: { amount: true, date: true },
      orderBy: { date: 'asc' },
    });

    const amounts = contributions.map((c) => Number(c.amount));
    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);
    const remaining = targetAmount - currentAmount;
    const percentageComplete = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const contributionCount = contributions.length;
    const averageContribution = contributionCount > 0 ? currentAmount / contributionCount : 0;
    const largestContribution = amounts.length > 0 ? Math.max(...amounts) : 0;
    const smallestContribution = amounts.length > 0 ? Math.min(...amounts) : 0;

    // Calcular dias
    const now = new Date();
    const createdAt = new Date(goal.createdAt);
    const deadline = goal.deadline ? new Date(goal.deadline) : null;
    const daysElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = deadline
      ? Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Estimar data de conclusão baseado na média de contribuições
    let estimatedCompletionDate: Date | null = null;
    if (averageContribution > 0 && remaining > 0 && contributionCount > 1) {
      const firstContribution = contributions[0];
      const lastContribution = contributions[contributions.length - 1];
      const daysBetween = Math.floor(
        (new Date(lastContribution.date).getTime() - new Date(firstContribution.date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const contributionsPerDay = contributionCount / (daysBetween || 1);
      const amountPerDay = currentAmount / (daysBetween || 1);
      const daysToComplete = remaining / (amountPerDay || 1);
      estimatedCompletionDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
    }

    return {
      currentAmount,
      targetAmount,
      remaining,
      percentageComplete,
      contributionCount,
      averageContribution,
      largestContribution,
      smallestContribution,
      daysElapsed,
      daysRemaining,
      estimatedCompletionDate,
    };
  }

  /**
   * Adiciona contribuição a uma meta
   */
  static async addContribution(
    goalId: string,
    amount: number,
    date: Date = new Date()
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // Criar contribuição
      const contribution = await tx.goalContribution.create({
        data: {
          goalId,
          amount,
          date,
          status: 'active',
        },
      });

      // Recalcular meta
      await this.recalculateGoalAmount(tx, goalId);

      return contribution;
    });
  }

  /**
   * Remove contribuição de uma meta
   */
  static async removeContribution(contributionId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const contribution = await tx.goalContribution.findUnique({
        where: { id: contributionId },
        select: { goalId: true },
      });

      if (!contribution) {
        throw new Error('Contribuição não encontrada');
      }

      // Marcar como cancelada
      await tx.goalContribution.update({
        where: { id: contributionId },
        data: { status: 'CANCELLED' },
      });

      // Recalcular meta
      await this.recalculateGoalAmount(tx, contribution.goalId);
    });
  }
}

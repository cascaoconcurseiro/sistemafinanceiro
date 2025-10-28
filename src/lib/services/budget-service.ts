/**
 * BudgetService - Serviço de gerenciamento de orçamentos
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from './validation-service';
import { Decimal } from '@prisma/client/runtime/library';

export interface BudgetUsage {
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    isOverBudget: boolean;
    shouldAlert: boolean;
}

export interface BudgetAlert {
    budgetId: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    percentageUsed: number;
    threshold: number;
}

export class BudgetService {
    /**
     * Cria orçamento por categoria
     * Requirements: 16.1
     */
    async createBudget(data: {
        userId: string;
        categoryId: string;
        amount: number;
        period: 'MONTHLY' | 'YEARLY';
        startDate: Date;
        endDate?: Date;
        alertThreshold?: number;
    }): Promise<any> {
        // Validar que categoria existe
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw new ValidationError('categoryId', 'Categoria não encontrada', 'NOT_FOUND');
        }

        const budget = await prisma.budget.create({
            data: {
                userId: data.userId,
                categoryId: data.categoryId,
                name: `Orçamento ${category.name}`,
                amount: new Decimal(data.amount),
                period: data.period,
                startDate: data.startDate,
                endDate: data.endDate || new Date(data.startDate.getFullYear() + 1, data.startDate.getMonth(), data.startDate.getDate()),
                alertThreshold: data.alertThreshold || 80,
            },
        });

        return budget;
    }

    /**
     * Calcula uso do orçamento
     * Requirements: 16.2
     */
    async calculateBudgetUsage(budgetId: string, userId: string): Promise<BudgetUsage> {
        const budget = await prisma.budget.findFirst({
            where: { id: budgetId, userId },
        });

        if (!budget) {
            throw new ValidationError('budgetId', 'Orçamento não encontrado', 'NOT_FOUND');
        }

        // Somar transações da categoria no período
        const transactions = await prisma.transaction.aggregate({
            where: {
                userId,
                categoryId: budget.categoryId,
                type: 'expense',
                deletedAt: null,
                date: {
                    gte: budget.startDate,
                    lte: budget.endDate,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const spentAmount = Math.abs(Number(transactions._sum.amount || 0));
        const budgetAmount = Number(budget.amount);
        const remainingAmount = budgetAmount - spentAmount;
        const percentageUsed = (spentAmount / budgetAmount) * 100;

        return {
            budgetAmount,
            spentAmount,
            remainingAmount,
            percentageUsed,
            isOverBudget: spentAmount > budgetAmount,
            shouldAlert: percentageUsed >= budget.alertThreshold,
        };
    }

    /**
     * Verifica alertas de orçamento
     * Requirements: 16.3, 16.4
     */
    async checkBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                isActive: true,
                endDate: {
                    gte: new Date(),
                },
            },
            include: {
                categoryRef: true,
            },
        });

        const alerts: BudgetAlert[] = [];

        for (const budget of budgets) {
            const usage = await this.calculateBudgetUsage(budget.id, userId);

            if (usage.shouldAlert) {
                alerts.push({
                    budgetId: budget.id,
                    categoryName: budget.categoryRef?.name || 'Sem categoria',
                    budgetAmount: usage.budgetAmount,
                    spentAmount: usage.spentAmount,
                    percentageUsed: usage.percentageUsed,
                    threshold: budget.alertThreshold,
                });
            }
        }

        return alerts;
    }

    /**
     * Gera relatório de orçamento vs real
     * Requirements: 16.5
     */
    async getBudgetReport(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                startDate: {
                    lte: endDate,
                },
                endDate: {
                    gte: startDate,
                },
            },
            include: {
                categoryRef: true,
            },
        });

        const report = [];

        for (const budget of budgets) {
            const usage = await this.calculateBudgetUsage(budget.id, userId);

            report.push({
                category: budget.categoryRef?.name || 'Sem categoria',
                budgeted: usage.budgetAmount,
                spent: usage.spentAmount,
                remaining: usage.remainingAmount,
                percentageUsed: usage.percentageUsed,
                status: usage.isOverBudget ? 'over' : usage.shouldAlert ? 'warning' : 'ok',
            });
        }

        return report;
    }
}

export const budgetService = new BudgetService();

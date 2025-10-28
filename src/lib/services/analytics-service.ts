/**
 * AnalyticsService - Serviço de análise e previsões
 */

import { prisma } from '@/lib/prisma';

export class AnalyticsService {
    /**
     * Calcula tendências de gastos
     * Requirements: 27.1, 27.2
     */
    async calculateTrends(userId: string): Promise<any> {
        const now = new Date();
        const trends: any = {};

        // Calcular médias para 3, 6 e 12 meses
        for (const months of [3, 6, 12]) {
            const startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - months);

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    type: 'expense',
                    deletedAt: null,
                    date: {
                        gte: startDate,
                        lte: now,
                    },
                },
                include: {
                    categoryRef: true,
                },
            });

            // Agrupar por categoria
            const byCategory: any = {};

            for (const transaction of transactions) {
                const categoryName = transaction.categoryRef?.name || 'Sem categoria';

                if (!byCategory[categoryName]) {
                    byCategory[categoryName] = [];
                }

                byCategory[categoryName].push(Math.abs(Number(transaction.amount)));
            }

            // Calcular médias
            const averages: any = {};
            for (const [category, amounts] of Object.entries(byCategory)) {
                const total = (amounts as number[]).reduce((sum, amount) => sum + amount, 0);
                averages[category] = total / months;
            }

            trends[`${months}months`] = averages;
        }

        // Identificar tendências (comparar 3 meses vs 6 meses)
        const increasing: string[] = [];
        const decreasing: string[] = [];

        for (const category in trends['3months']) {
            const recent = trends['3months'][category];
            const older = trends['6months'][category] || recent;

            const change = ((recent - older) / older) * 100;

            if (change > 10) {
                increasing.push(category);
            } else if (change < -10) {
                decreasing.push(category);
            }
        }

        return {
            trends,
            increasing,
            decreasing,
        };
    }

    /**
     * Prevê saldo futuro
     * Requirements: 27.3
     */
    async predictFutureBalance(userId: string, monthsAhead: number = 3): Promise<any[]> {
        // Calcular saldo atual
        const currentBalance = await this.getCurrentBalance(userId);

        // Buscar receitas e despesas recorrentes
        const recurringTemplates = await prisma.recurringTransactionTemplate.findMany({
            where: {
                userId,
                isActive: true,
            },
        });

        // Buscar faturas futuras
        const futureInvoices = await prisma.invoice.findMany({
            where: {
                userId,
                isPaid: false,
                dueDate: {
                    gte: new Date(),
                },
            },
        });

        const predictions: any[] = [];
        let balance = currentBalance;

        for (let month = 1; month <= monthsAhead; month++) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() + month);

            let monthlyIncome = 0;
            let monthlyExpense = 0;

            // Calcular receitas/despesas recorrentes
            for (const template of recurringTemplates) {
                const data = JSON.parse(template.templateData);
                const amount = Number(data.amount);

                if (data.type === 'income') {
                    monthlyIncome += amount;
                } else {
                    monthlyExpense += Math.abs(amount);
                }
            }

            // Adicionar faturas do mês
            const monthInvoices = futureInvoices.filter((inv) => {
                const invMonth = inv.dueDate.getMonth();
                const invYear = inv.dueDate.getFullYear();
                return invMonth === monthDate.getMonth() && invYear === monthDate.getFullYear();
            });

            for (const invoice of monthInvoices) {
                monthlyExpense += Number(invoice.totalAmount);
            }

            balance = balance + monthlyIncome - monthlyExpense;

            predictions.push({
                month: monthDate.toISOString().substring(0, 7),
                income: monthlyIncome,
                expense: monthlyExpense,
                predictedBalance: balance,
            });
        }

        return predictions;
    }

    /**
     * Alerta se saldo ficará negativo
     * Requirements: 27.4
     */
    async checkNegativeBalanceAlert(userId: string): Promise<any> {
        const predictions = await this.predictFutureBalance(userId, 6);

        const negativeMonths = predictions.filter((p) => p.predictedBalance < 0);

        if (negativeMonths.length > 0) {
            return {
                hasAlert: true,
                firstNegativeMonth: negativeMonths[0].month,
                predictedBalance: negativeMonths[0].predictedBalance,
                message: `Atenção: Saldo previsto ficará negativo em ${negativeMonths[0].month}`,
            };
        }

        return {
            hasAlert: false,
            message: 'Saldo previsto positivo nos próximos 6 meses',
        };
    }

    /**
     * Gera dados para gráficos de tendência
     * Requirements: 27.5
     */
    async getTrendCharts(userId: string, months: number = 12): Promise<any> {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                deletedAt: null,
                date: {
                    gte: startDate,
                },
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Agrupar por mês
        const byMonth: any = {};

        for (const transaction of transactions) {
            const monthKey = transaction.date.toISOString().substring(0, 7);

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = {
                    income: 0,
                    expense: 0,
                };
            }

            const amount = Number(transaction.amount);

            if (amount > 0) {
                byMonth[monthKey].income += amount;
            } else {
                byMonth[monthKey].expense += Math.abs(amount);
            }
        }

        return {
            labels: Object.keys(byMonth),
            income: Object.values(byMonth).map((m: any) => m.income),
            expense: Object.values(byMonth).map((m: any) => m.expense),
        };
    }

    /**
     * Calcula saldo atual total
     */
    private async getCurrentBalance(userId: string): Promise<number> {
        const result = await prisma.transaction.aggregate({
            where: {
                userId,
                deletedAt: null,
            },
            _sum: {
                amount: true,
            },
        });

        return Number(result._sum.amount || 0);
    }
}

export const analyticsService = new AnalyticsService();

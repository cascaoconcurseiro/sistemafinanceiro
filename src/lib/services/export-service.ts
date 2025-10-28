/**
 * ExportService - Serviço de exportação e backup
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from './validation-service';

export class ExportService {
    /**
     * Exporta transações
     * Requirements: 23.2
     */
    async exportTransactions(
        userId: string,
        format: 'CSV' | 'JSON' | 'EXCEL',
        filters?: {
            startDate?: Date;
            endDate?: Date;
            accountId?: string;
            categoryId?: string;
        }
    ): Promise<string> {
        const where: any = {
            userId,
            deletedAt: null,
        };

        if (filters?.startDate) {
            where.date = { ...where.date, gte: filters.startDate };
        }
        if (filters?.endDate) {
            where.date = { ...where.date, lte: filters.endDate };
        }
        if (filters?.accountId) {
            where.accountId = filters.accountId;
        }
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                account: true,
                categoryRef: true,
                creditCard: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        if (format === 'JSON') {
            return JSON.stringify(transactions, null, 2);
        } else if (format === 'CSV') {
            const headers = [
                'Data',
                'Descrição',
                'Tipo',
                'Valor',
                'Conta',
                'Categoria',
                'Método de Pagamento',
            ];

            const rows = transactions.map((t) => [
                t.date.toISOString().split('T')[0],
                t.description,
                t.type,
                Number(t.amount).toFixed(2),
                t.account?.name || t.creditCard?.name || '',
                t.categoryRef?.name || '',
                t.paymentMethod || '',
            ]);

            return [headers, ...rows].map((row) => row.join(',')).join('\n');
        }

        return JSON.stringify(transactions);
    }

    /**
     * Exporta backup completo
     * Requirements: 23.1, 23.3
     */
    async exportFullBackup(userId: string): Promise<string> {
        const data: any = {};

        // Exportar todas as entidades do usuário
        data.user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                monthlyIncome: true,
                emergencyReserve: true,
                riskProfile: true,
                financialGoals: true,
                preferences: true,
            },
        });

        data.accounts = await prisma.account.findMany({
            where: { userId, deletedAt: null },
        });

        data.transactions = await prisma.transaction.findMany({
            where: { userId, deletedAt: null },
        });

        data.creditCards = await prisma.creditCard.findMany({
            where: { userId },
        });

        data.budgets = await prisma.budget.findMany({
            where: { userId },
        });

        data.goals = await prisma.goal.findMany({
            where: { userId },
        });

        data.trips = await prisma.trip.findMany({
            where: { userId },
        });

        data.recurringTemplates = await prisma.recurringTransactionTemplate.findMany({
            where: { userId },
        });

        data.tags = await prisma.tag.findMany({
            where: { userId },
        });

        data.exportDate = new Date().toISOString();
        data.version = '1.0';

        return JSON.stringify(data, null, 2);
    }

    /**
     * Importa backup
     * Requirements: 23.4, 23.5
     */
    async importBackup(userId: string, backupData: string): Promise<{ success: boolean; message: string }> {
        try {
            const data = JSON.parse(backupData);

            // Validar estrutura do backup
            if (!data.version || !data.exportDate) {
                throw new ValidationError('backup', 'Formato de backup inválido', 'INVALID_FORMAT');
            }

            // Usar transação atômica
            await prisma.$transaction(async (tx) => {
                // Importar contas
                if (data.accounts) {
                    for (const account of data.accounts) {
                        const { id, ...accountData } = account;
                        await tx.account.upsert({
                            where: { id },
                            create: { ...accountData, userId },
                            update: accountData,
                        });
                    }
                }

                // Importar transações
                if (data.transactions) {
                    for (const transaction of data.transactions) {
                        const { id, ...transactionData } = transaction;
                        await tx.transaction.upsert({
                            where: { id },
                            create: { ...transactionData, userId },
                            update: transactionData,
                        });
                    }
                }

                // Importar outras entidades...
                // (budgets, goals, trips, etc)
            });

            return {
                success: true,
                message: 'Backup importado com sucesso',
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Erro ao importar backup: ${error.message}`,
            };
        }
    }

    /**
     * Gera relatório fiscal
     * Requirements: 24.1, 24.2, 24.3, 24.4, 24.5
     */
    async generateTaxReport(userId: string, year: number): Promise<any> {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        // Buscar transações dedutíveis
        const deductibleTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                isTaxDeductible: true,
                deletedAt: null,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                categoryRef: true,
            },
        });

        // Agrupar por categoria fiscal
        const byCategory: any = {};

        for (const transaction of deductibleTransactions) {
            const category = transaction.taxCategory || 'Outros';

            if (!byCategory[category]) {
                byCategory[category] = {
                    category,
                    transactions: [],
                    total: 0,
                };
            }

            byCategory[category].transactions.push(transaction);
            byCategory[category].total += Math.abs(Number(transaction.amount));
        }

        // Calcular totais
        const totalDeductible = Object.values(byCategory).reduce(
            (sum: number, cat: any) => sum + cat.total,
            0
        );

        return {
            year,
            totalDeductible,
            byCategory: Object.values(byCategory),
            generatedAt: new Date().toISOString(),
        };
    }
}

export const exportService = new ExportService();

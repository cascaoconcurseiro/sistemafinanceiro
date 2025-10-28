/**
 * RecurringService - Serviço de gerenciamento de transações recorrentes
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from './validation-service';
import { Decimal } from '@prisma/client/runtime/library';

export class RecurringService {
    /**
     * Cria template de transação recorrente
     * Requirements: 14.1, 14.2
     */
    async createRecurringTemplate(data: {
        userId: string;
        templateData: any;
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
        startDate: Date;
        endDate?: Date;
        occurrences?: number;
    }): Promise<any> {
        // Calcular próxima geração
        const nextGeneration = this.calculateNextGeneration(data.startDate, data.frequency);

        const template = await prisma.recurringTransactionTemplate.create({
            data: {
                userId: data.userId,
                templateData: JSON.stringify(data.templateData),
                frequency: data.frequency,
                startDate: data.startDate,
                endDate: data.endDate,
                occurrences: data.occurrences,
                isActive: true,
                nextGeneration,
            },
        });

        return template;
    }

    /**
     * Gera transações recorrentes que estão vencidas
     * Requirements: 14.3, 14.4
     */
    async generateDueTransactions(): Promise<any[]> {
        const now = new Date();
        const generatedTransactions: any[] = [];

        // Buscar templates ativos com nextGeneration <= hoje
        const templates = await prisma.recurringTransactionTemplate.findMany({
            where: {
                isActive: true,
                nextGeneration: {
                    lte: now,
                },
            },
        });

        for (const template of templates) {
            try {
                const templateData = JSON.parse(template.templateData);

                // Criar transação baseada no template
                const transaction = await prisma.transaction.create({
                    data: {
                        userId: template.userId,
                        accountId: templateData.accountId,
                        creditCardId: templateData.creditCardId,
                        categoryId: templateData.categoryId,
                        amount: new Decimal(templateData.amount),
                        description: templateData.description,
                        type: templateData.type,
                        date: template.nextGeneration,
                        paymentMethod: templateData.paymentMethod,
                        isRecurring: true,
                        recurringId: template.id,
                        frequency: template.frequency,
                    },
                });

                generatedTransactions.push(transaction);

                // Atualizar nextGeneration
                const nextGeneration = this.calculateNextGeneration(
                    template.nextGeneration,
                    template.frequency
                );

                // Verificar se deve continuar gerando
                let shouldContinue = true;

                if (template.endDate && nextGeneration > template.endDate) {
                    shouldContinue = false;
                }

                if (template.occurrences) {
                    const generatedCount = await prisma.transaction.count({
                        where: {
                            recurringId: template.id,
                        },
                    });

                    if (generatedCount >= template.occurrences) {
                        shouldContinue = false;
                    }
                }

                await prisma.recurringTransactionTemplate.update({
                    where: { id: template.id },
                    data: {
                        lastGenerated: now,
                        nextGeneration: shouldContinue ? nextGeneration : null,
                        isActive: shouldContinue,
                    },
                });

                // Criar notificação
                await prisma.notification.create({
                    data: {
                        userId: template.userId,
                        type: 'RECURRING_GENERATED',
                        title: 'Transação recorrente gerada',
                        message: `${templateData.description} - R$ ${Math.abs(templateData.amount).toFixed(2)}`,
                        isRead: false,
                    },
                });
            } catch (error) {
                console.error(`Erro ao gerar transação recorrente ${template.id}:`, error);
            }
        }

        return generatedTransactions;
    }

    /**
     * Atualiza template de recorrência
     * Requirements: 14.5
     */
    async updateRecurringTemplate(
        id: string,
        userId: string,
        data: {
            templateData?: any;
            frequency?: string;
            endDate?: Date;
            updateFuture?: boolean;
        }
    ): Promise<any> {
        const template = await prisma.recurringTransactionTemplate.findFirst({
            where: { id, userId },
        });

        if (!template) {
            throw new ValidationError('id', 'Template não encontrado', 'NOT_FOUND');
        }

        // Atualizar template
        const updated = await prisma.recurringTransactionTemplate.update({
            where: { id },
            data: {
                templateData: data.templateData ? JSON.stringify(data.templateData) : undefined,
                frequency: data.frequency,
                endDate: data.endDate,
            },
        });

        // Se updateFuture = true, atualizar transações futuras
        if (data.updateFuture && data.templateData) {
            await prisma.transaction.updateMany({
                where: {
                    recurringId: id,
                    date: {
                        gte: new Date(),
                    },
                },
                data: {
                    amount: data.templateData.amount ? new Decimal(data.templateData.amount) : undefined,
                    description: data.templateData.description,
                    categoryId: data.templateData.categoryId,
                },
            });
        }

        return updated;
    }

    /**
     * Cancela recorrência
     * Requirements: 14.5
     */
    async cancelRecurring(id: string, userId: string, keepPast: boolean = true): Promise<void> {
        const template = await prisma.recurringTransactionTemplate.findFirst({
            where: { id, userId },
        });

        if (!template) {
            throw new ValidationError('id', 'Template não encontrado', 'NOT_FOUND');
        }

        // Marcar template como inativo
        await prisma.recurringTransactionTemplate.update({
            where: { id },
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });

        // Se não manter passadas, excluir transações futuras
        if (!keepPast) {
            await prisma.transaction.updateMany({
                where: {
                    recurringId: id,
                    date: {
                        gte: new Date(),
                    },
                },
                data: {
                    deletedAt: new Date(),
                },
            });
        }
    }

    /**
     * Calcula próxima data de geração
     */
    private calculateNextGeneration(currentDate: Date, frequency: string): Date {
        const next = new Date(currentDate);

        switch (frequency) {
            case 'DAILY':
                next.setDate(next.getDate() + 1);
                break;
            case 'WEEKLY':
                next.setDate(next.getDate() + 7);
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + 1);
                break;
        }

        return next;
    }
}

export const recurringService = new RecurringService();

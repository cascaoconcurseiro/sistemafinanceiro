/**
 * FraudDetectionService - Serviço de detecção de fraudes
 */

import { prisma } from '@/lib/prisma';

export class FraudDetectionService {
    /**
     * Detecta valores anormais
     * Requirements: 28.1
     */
    async detectAnomalies(userId: string): Promise<any[]> {
        // Calcular média e desvio padrão dos últimos 90 dias
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'expense',
                deletedAt: null,
                date: {
                    gte: ninetyDaysAgo,
                },
            },
        });

        const amounts = transactions.map((t) => Math.abs(Number(t.amount)));
        const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

        // Calcular desvio padrão
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);

        // Threshold: 3x desvio padrão
        const threshold = mean + 3 * stdDev;

        // Buscar transações recentes acima do threshold
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const suspicious = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'expense',
                deletedAt: null,
                isSuspicious: false,
                date: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        const anomalies = suspicious.filter((t) => Math.abs(Number(t.amount)) > threshold);

        // Marcar como suspeitas
        for (const transaction of anomalies) {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { isSuspicious: true },
            });
        }

        return anomalies;
    }

    /**
     * Detecta múltiplas transações em curto período
     * Requirements: 28.2
     */
    async detectMultipleTransactions(userId: string): Promise<any[]> {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // Buscar transações da última hora
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                deletedAt: null,
                createdAt: {
                    gte: oneHourAgo,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Se mais de 5 transações em 1 hora, alertar
        if (recentTransactions.length > 5) {
            // Criar notificação
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'FRAUD_ALERT',
                    title: 'Atividade suspeita detectada',
                    message: `${recentTransactions.length} transações criadas na última hora`,
                    isRead: false,
                },
            });

            return recentTransactions;
        }

        return [];
    }

    /**
     * Marca transação como fraudulenta
     * Requirements: 28.3, 28.4, 28.5
     */
    async markAsFraudulent(transactionId: string, userId: string): Promise<void> {
        const transaction = await prisma.transaction.findFirst({
            where: { id: transactionId, userId },
        });

        if (!transaction) {
            return;
        }

        // Marcar como fraudulenta
        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                isFraudulent: true,
                isSuspicious: true,
            },
        });

        // Criar notificação
        await prisma.notification.create({
            data: {
                userId,
                type: 'FRAUD_CONFIRMED',
                title: 'Transação marcada como fraude',
                message: `${transaction.description} - R$ ${Math.abs(Number(transaction.amount)).toFixed(2)}`,
                isRead: false,
            },
        });

        // Registrar em auditoria
        await prisma.auditEvent.create({
            data: {
                userId,
                tableName: 'Transaction',
                recordId: transactionId,
                operation: 'MARK_FRAUDULENT',
                newValues: JSON.stringify({ isFraudulent: true }),
            },
        });
    }

    /**
     * Lista transações fraudulentas
     */
    async getFraudulentTransactions(userId: string): Promise<any[]> {
        return prisma.transaction.findMany({
            where: {
                userId,
                isFraudulent: true,
                deletedAt: null,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }
}

export const fraudDetectionService = new FraudDetectionService();

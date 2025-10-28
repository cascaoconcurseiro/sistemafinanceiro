/**
 * NotificationService - Serviço de notificações
 */

import { prisma } from '@/lib/prisma';

export class NotificationService {
    /**
     * Cria notificação
     * Requirements: 22.1, 22.2, 22.3
     */
    async createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
    }): Promise<any> {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                isRead: false,
            },
        });

        return notification;
    }

    /**
     * Verifica vencimentos de faturas
     * Requirements: 22.1
     */
    async checkInvoiceDues(): Promise<void> {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Buscar faturas não pagas com vencimento em 3 dias
        const dueInvoices = await prisma.invoice.findMany({
            where: {
                isPaid: false,
                dueDate: {
                    lte: threeDaysFromNow,
                    gte: new Date(),
                },
            },
            include: {
                creditCard: true,
            },
        });

        for (const invoice of dueInvoices) {
            // Verificar se já existe notificação
            const existing = await prisma.notification.findFirst({
                where: {
                    userId: invoice.userId,
                    type: 'INVOICE_DUE',
                    message: {
                        contains: invoice.id,
                    },
                },
            });

            if (!existing) {
                await this.createNotification({
                    userId: invoice.userId,
                    type: 'INVOICE_DUE',
                    title: 'Fatura próxima do vencimento',
                    message: `Fatura do cartão ${invoice.creditCard.name} vence em ${Math.ceil((invoice.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias. Valor: R$ ${Number(invoice.totalAmount).toFixed(2)}`,
                });
            }
        }
    }

    /**
     * Verifica alertas de orçamento
     * Requirements: 22.2
     */
    async checkBudgetAlerts(): Promise<void> {
        const { budgetService } = await import('./budget-service');

        // Buscar todos os usuários ativos
        const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        for (const user of users) {
            const alerts = await budgetService.checkBudgetAlerts(user.id);

            for (const alert of alerts) {
                // Verificar se já existe notificação recente
                const oneDayAgo = new Date();
                oneDayAgo.setDate(oneDayAgo.getDate() - 1);

                const existing = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'BUDGET_ALERT',
                        message: {
                            contains: alert.categoryName,
                        },
                        createdAt: {
                            gte: oneDayAgo,
                        },
                    },
                });

                if (!existing) {
                    await this.createNotification({
                        userId: user.id,
                        type: 'BUDGET_ALERT',
                        title: 'Alerta de orçamento',
                        message: `Orçamento de ${alert.categoryName} atingiu ${alert.percentageUsed.toFixed(0)}% (R$ ${alert.spentAmount.toFixed(2)} de R$ ${alert.budgetAmount.toFixed(2)})`,
                    });
                }
            }
        }
    }

    /**
     * Envia notificação
     * Requirements: 22.4
     */
    async sendNotification(notificationId: string): Promise<void> {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            include: { user: true },
        });

        if (!notification) {
            return;
        }

        // Buscar configurações do usuário
        const settings = await prisma.userSettings.findUnique({
            where: { userId: notification.userId },
        });

        // Enviar email se habilitado
        if (settings?.emailNotifications) {
            // TODO: Integrar com serviço de email
            console.log(`Email para ${notification.user.email}: ${notification.title}`);
        }

        // Enviar push se habilitado
        if (settings?.pushNotifications) {
            // TODO: Integrar com serviço de push
            console.log(`Push para ${notification.userId}: ${notification.title}`);
        }
    }

    /**
     * Marca notificação como lida
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                isRead: true,
            },
        });
    }

    /**
     * Lista notificações do usuário
     */
    async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
        const where: any = { userId };

        if (unreadOnly) {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });

        return notifications;
    }
}

export const notificationService = new NotificationService();

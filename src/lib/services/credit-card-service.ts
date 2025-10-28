/**
 * CreditCardService - Serviço de gerenciamento de cartões de crédito
 * 
 * Responsável por gerenciar faturas, limites, juros e pagamentos de cartões.
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from './validation-service';
import { Decimal } from '@prisma/client/runtime/library';

export class CreditCardService {
    /**
     * Atualiza o limite usado do cartão
     * Chamado ao criar/deletar transações de cartão
     */
    async updateUsedLimit(creditCardId: string, amount: number, userId: string): Promise<void> {
        const card = await prisma.creditCard.findFirst({
            where: { id: creditCardId, userId },
        });

        if (!card) {
            throw new ValidationError('creditCardId', 'Cartão não encontrado', 'NOT_FOUND');
        }

        const newBalance = Number(card.currentBalance) + amount;
        const cardLimit = Number(card.limit);

        // Validar se não excede o limite
        if (newBalance > cardLimit) {
            throw new ValidationError(
                'amount',
                `Limite do cartão excedido. Disponível: R$ ${(cardLimit - Number(card.currentBalance)).toFixed(2)}`,
                'LIMIT_EXCEEDED'
            );
        }

        // Não permitir saldo negativo (para estornos)
        if (newBalance < 0) {
            console.log('⚠️ [CreditCard] Saldo ficaria negativo, ajustando para 0');
            await prisma.creditCard.update({
                where: { id: creditCardId },
                data: { currentBalance: new Decimal(0) },
            });
            return;
        }

        await prisma.creditCard.update({
            where: { id: creditCardId },
            data: { currentBalance: new Decimal(newBalance) },
        });

        console.log(`✅ [CreditCard] Limite atualizado: ${card.name} - Novo saldo: R$ ${newBalance.toFixed(2)}`);
    }

    /**
     * Restaura limite ao pagar fatura
     */
    async restoreLimitOnPayment(creditCardId: string, paidAmount: number, userId: string): Promise<void> {
        const card = await prisma.creditCard.findFirst({
            where: { id: creditCardId, userId },
        });

        if (!card) {
            throw new ValidationError('creditCardId', 'Cartão não encontrado', 'NOT_FOUND');
        }

        const newBalance = Math.max(0, Number(card.currentBalance) - paidAmount);

        await prisma.creditCard.update({
            where: { id: creditCardId },
            data: { currentBalance: new Decimal(newBalance) },
        });
    }

    /**
     * Gera fatura mensal de um cartão
     * Requirements: 10.1, 10.2, 10.3, 10.4
     */
    async generateInvoice(creditCardId: string, month: number, year: number, userId: string): Promise<any> {
        // Validar que cartão existe e pertence ao usuário
        const card = await prisma.creditCard.findFirst({
            where: { id: creditCardId, userId },
        });

        if (!card) {
            throw new ValidationError('creditCardId', 'Cartão não encontrado', 'NOT_FOUND');
        }

        // Verificar se fatura já existe
        const existing = await prisma.invoice.findUnique({
            where: {
                creditCardId_month_year: {
                    creditCardId,
                    month,
                    year,
                },
            },
        });

        if (existing) {
            return existing; // Já existe, retornar
        }

        // Calcular período de fechamento
        const closingDate = new Date(year, month - 1, card.closingDay);
        const previousClosingDate = new Date(closingDate);
        previousClosingDate.setMonth(previousClosingDate.getMonth() - 1);

        // Buscar todas as transações do período
        const transactions = await prisma.transaction.findMany({
            where: {
                creditCardId,
                userId,
                deletedAt: null,
                date: {
                    gt: previousClosingDate,
                    lte: closingDate,
                },
            },
        });

        // Calcular total da fatura
        let totalAmount = 0;
        for (const transaction of transactions) {
            const amount = Number(transaction.amount);

            // Se é despesa compartilhada, incluir apenas a parte proporcional
            if (transaction.isShared && transaction.sharedWith) {
                try {
                    const sharedData = JSON.parse(transaction.sharedWith as string);
                    const userShare = sharedData.find((s: any) => s.userId === userId);
                    if (userShare) {
                        totalAmount += Math.abs(userShare.amount);
                    }
                } catch (e) {
                    // Se falhar ao parsear, usar valor total
                    totalAmount += Math.abs(amount);
                }
            } else {
                totalAmount += Math.abs(amount);
            }
        }

        // Calcular data de vencimento
        const dueDate = new Date(year, month - 1, card.dueDay);

        // Criar fatura
        const invoice = await prisma.invoice.create({
            data: {
                creditCardId,
                userId,
                month,
                year,
                totalAmount: new Decimal(totalAmount),
                paidAmount: new Decimal(0),
                dueDate,
                isPaid: false,
            },
        });

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Invoice',
            entityId: invoice.id,
            action: 'CREATE',
            newValue: JSON.stringify(invoice),
        });

        return invoice;
    }

    /**
     * Calcula limite disponível do cartão
     * Requirements: 26.1, 26.2, 26.3
     */
    async calculateAvailableLimit(creditCardId: string, userId: string): Promise<number> {
        // Buscar cartão
        const card = await prisma.creditCard.findFirst({
            where: { id: creditCardId, userId },
        });

        if (!card) {
            throw new ValidationError('creditCardId', 'Cartão não encontrado', 'NOT_FOUND');
        }

        // Calcular total de transações futuras (parcelas pendentes)
        const futureTransactions = await prisma.transaction.aggregate({
            where: {
                creditCardId,
                deletedAt: null,
                date: {
                    gte: new Date(),
                },
            },
            _sum: {
                amount: true,
            },
        });

        const usedLimit = Number(card.currentBalance) + Math.abs(Number(futureTransactions._sum.amount || 0));
        const availableLimit = Number(card.limit) - usedLimit;

        // Alertar se < 20%
        const threshold = Number(card.limit) * 0.2;
        if (availableLimit < threshold) {
            // TODO: Criar notificação de alerta
            console.warn(`Limite do cartão ${card.name} está abaixo de 20%`);
        }

        return Math.max(0, availableLimit);
    }

    /**
     * Registra pagamento de fatura
     * Requirements: 10.5
     */
    async payInvoice(
        invoiceId: string,
        userId: string,
        amount: number,
        accountId?: string
    ): Promise<any> {
        // Buscar fatura
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, userId },
            include: { creditCard: true },
        });

        if (!invoice) {
            throw new ValidationError('invoiceId', 'Fatura não encontrada', 'NOT_FOUND');
        }

        // Calcular novo valor pago
        const newPaidAmount = Number(invoice.paidAmount) + amount;
        const isPaid = newPaidAmount >= Number(invoice.totalAmount);

        let paymentTransactionId: string | undefined;

        // Se foi especificada uma conta, debitar dela
        if (accountId) {
            const paymentTransaction = await prisma.transaction.create({
                data: {
                    userId,
                    accountId,
                    amount: new Decimal(-amount),
                    description: `Pagamento de fatura - ${invoice.creditCard.name} ${invoice.month}/${invoice.year}`,
                    type: 'expense',
                    date: new Date(),
                    paymentMethod: 'ACCOUNT',
                    relatedInvoiceId: invoiceId, // ✅ Rastreamento
                },
            });
            paymentTransactionId = paymentTransaction.id;
        }

        // Atualizar fatura
        const updated = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: new Decimal(newPaidAmount),
                isPaid,
                paidAt: isPaid ? new Date() : invoice.paidAt,
                paymentTransactionId, // ✅ Rastreamento
            },
        });

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Invoice',
            entityId: invoiceId,
            action: 'PAY',
            newValue: JSON.stringify({ amount, newPaidAmount, isPaid, paymentTransactionId }),
        });

        return updated;
    }

    /**
     * Reverte pagamento de fatura quando transação é deletada
     * Garante integridade referencial completa:
     * - Reverte status da fatura
     * - Deleta transação de pagamento
     * - Restaura saldo da conta bancária
     * - Reverte transações do cartão para pending
     */
    async revertInvoicePayment(
        invoiceId: string,
        userId: string,
        paymentTransactionId?: string
    ): Promise<void> {
        console.log('🔄 [CreditCard] Revertendo pagamento de fatura:', invoiceId);

        // Buscar fatura
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, userId },
            include: { creditCard: true },
        });

        if (!invoice) {
            console.warn('⚠️ [CreditCard] Fatura não encontrada:', invoiceId);
            return;
        }

        // Buscar transação de pagamento antes de deletar (para restaurar saldo da conta)
        let paymentTransaction = null;
        if (paymentTransactionId) {
            paymentTransaction = await prisma.transaction.findUnique({
                where: { id: paymentTransactionId },
                include: { account: true },
            });
        } else if (invoice.paymentTransactionId) {
            paymentTransaction = await prisma.transaction.findUnique({
                where: { id: invoice.paymentTransactionId },
                include: { account: true },
            });
        }

        // Reverter status da fatura
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                isPaid: false,
                paidAmount: new Decimal(0),
                paidAt: null,
                paymentTransactionId: null,
            },
        });

        console.log('✅ [CreditCard] Fatura revertida para não paga');

        // Deletar transação de pagamento e restaurar saldo da conta
        if (paymentTransaction) {
            const accountId = paymentTransaction.accountId;
            const paymentAmount = Math.abs(Number(paymentTransaction.amount));

            try {
                // Deletar a transação de pagamento
                await prisma.transaction.delete({
                    where: { id: paymentTransaction.id },
                });
                console.log('✅ [CreditCard] Transação de pagamento deletada:', paymentTransaction.id);

                // Restaurar saldo da conta (adicionar de volta o valor que foi debitado)
                if (accountId) {
                    const account = await prisma.account.findUnique({
                        where: { id: accountId },
                    });

                    if (account) {
                        const newBalance = Number(account.balance) + paymentAmount;
                        await prisma.account.update({
                            where: { id: accountId },
                            data: { balance: new Decimal(newBalance) },
                        });
                        console.log(`✅ [CreditCard] Saldo da conta ${account.name} restaurado: +R$ ${paymentAmount.toFixed(2)}`);
                        console.log(`   Saldo anterior: R$ ${Number(account.balance).toFixed(2)}`);
                        console.log(`   Saldo novo: R$ ${newBalance.toFixed(2)}`);
                    }
                }
            } catch (error) {
                console.warn('⚠️ [CreditCard] Erro ao deletar transação de pagamento:', error);
            }
        }

        // Buscar todas as transações da fatura e reverter para pending
        const transactions = await prisma.transaction.findMany({
            where: {
                creditCardId: invoice.creditCardId,
                userId,
                deletedAt: null,
                date: {
                    gte: new Date(invoice.year, invoice.month - 2, invoice.creditCard.closingDay),
                    lte: new Date(invoice.year, invoice.month - 1, invoice.creditCard.closingDay),
                },
            },
        });

        for (const tx of transactions) {
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { status: 'pending' },
            });
        }

        console.log(`✅ [CreditCard] ${transactions.length} transações revertidas para pending`);

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Invoice',
            entityId: invoiceId,
            action: 'REVERT_PAYMENT',
            newValue: JSON.stringify({ 
                paymentTransactionId: paymentTransaction?.id,
                accountId: paymentTransaction?.accountId,
                restoredAmount: paymentTransaction ? Math.abs(Number(paymentTransaction.amount)) : 0,
            }),
        });
    }

    /**
     * Calcula juros rotativos sobre saldo não pago
     * Requirements: 18.3, 18.4
     */
    async calculateInterest(invoiceId: string, userId: string): Promise<number> {
        // Buscar fatura
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, userId },
            include: { creditCard: true },
        });

        if (!invoice) {
            throw new ValidationError('invoiceId', 'Fatura não encontrada', 'NOT_FOUND');
        }

        // Se não tem taxa de juros configurada, retornar 0
        if (!invoice.creditCard.interestRate) {
            return 0;
        }

        // Calcular saldo não pago
        const unpaidBalance = Number(invoice.totalAmount) - Number(invoice.paidAmount);

        if (unpaidBalance <= 0) {
            return 0; // Fatura paga, sem juros
        }

        // Calcular juros (taxa mensal)
        const interestRate = Number(invoice.creditCard.interestRate) / 100;
        const interest = unpaidBalance * interestRate;

        return interest;
    }

    /**
     * Valida se transação excede limite disponível
     * Requirements: 26.4
     */
    async validateLimit(creditCardId: string, userId: string, amount: number): Promise<boolean> {
        const availableLimit = await this.calculateAvailableLimit(creditCardId, userId);

        if (Math.abs(amount) > availableLimit) {
            throw new ValidationError(
                'amount',
                `Limite insuficiente. Disponível: R$ ${availableLimit.toFixed(2)}`,
                'INSUFFICIENT_LIMIT'
            );
        }

        return true;
    }

    /**
     * Registra evento de auditoria
     */
    private async logAudit(data: {
        userId: string;
        entityType: string;
        entityId: string;
        action: string;
        fieldName?: string;
        oldValue?: string;
        newValue?: string;
    }): Promise<void> {
        await prisma.auditEvent.create({
            data: {
                userId: data.userId,
                tableName: data.entityType,
                recordId: data.entityId,
                operation: data.action,
                oldValues: data.oldValue,
                newValues: data.newValue,
                metadata: data.fieldName ? JSON.stringify({ fieldName: data.fieldName }) : undefined,
            },
        });
    }
}

// Exportar instância singleton
export const creditCardService = new CreditCardService();

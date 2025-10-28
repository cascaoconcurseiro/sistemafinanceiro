/**
 * TransactionService - Serviço de gerenciamento de transações
 * 
 * Responsável por criar, atualizar, excluir e gerenciar transações financeiras
 * com todas as regras de negócio aplicadas.
 */

import { prisma } from '@/lib/prisma';
import { validationService, ValidationError, TransactionInput, InstallmentInput, SharedExpenseInput, TransferInput } from './validation-service';
import { Decimal } from '@prisma/client/runtime/library';

// Interfaces
export interface CreateTransactionResult {
    transaction: any;
    auditLog?: any;
}

export interface DeleteOptions {
    deleteAll?: boolean; // Para grupos de parcelas
    keepTransactions?: boolean; // Para exclusão de contas
}

export interface UpdateTransactionData {
    amount?: number;
    description?: string;
    date?: Date;
    categoryId?: string;
    accountId?: string;
    creditCardId?: string;
}

export class TransactionService {
    /**
     * Cria uma transação simples
     * Requirements: 1.2, 2.1, 2.2, 7.5
     */
    async createTransaction(data: TransactionInput): Promise<CreateTransactionResult> {
        // Validar transação
        const validation = await validationService.validateTransaction(data);
        if (!validation.isValid) {
            throw validation.errors[0];
        }

        // Criar transação no banco
        const transaction = await prisma.transaction.create({
            data: {
                userId: data.userId,
                accountId: data.accountId,
                creditCardId: data.creditCardId,
                categoryId: data.categoryId,
                amount: new Decimal(data.amount),
                description: data.description,
                type: data.type,
                date: data.date,
                paymentMethod: data.paymentMethod,
                paidBy: data.paidBy,
                owedTo: data.owedTo,
                tripId: data.tripId,
            },
        });

        // Atualizar saldo da conta (se for conta)
        if (data.accountId) {
            await this.updateAccountBalance(data.accountId);
        }

        // Atualizar saldo do cartão (se for cartão)
        if (data.creditCardId) {
            await this.updateCreditCardBalance(data.creditCardId);
        }

        // Registrar em AuditLog
        await this.logAudit({
            userId: data.userId,
            entityType: 'Transaction',
            entityId: transaction.id,
            action: 'CREATE',
            newValue: JSON.stringify(transaction),
        });

        return { transaction };
    }

    /**
     * Cria transação parcelada
     * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6
     */
    async createInstallmentTransaction(data: InstallmentInput): Promise<any[]> {
        // Validar parcelamento
        const validation = await validationService.validateInstallment(data);
        if (!validation.isValid) {
            throw validation.errors[0];
        }

        const installmentGroupId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const installmentAmount = Math.abs(data.amount) / data.totalInstallments;
        const transactions: any[] = [];

        // Buscar data de fechamento do cartão
        const card = await prisma.creditCard.findUnique({
            where: { id: data.creditCardId },
        });

        if (!card) {
            throw new ValidationError('creditCardId', 'Cartão não encontrado', 'CARD_NOT_FOUND');
        }

        // Criar parcelas
        for (let i = 1; i <= data.totalInstallments; i++) {
            const installmentDate = new Date(data.firstDueDate);
            installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

            const transaction = await prisma.transaction.create({
                data: {
                    userId: data.userId,
                    creditCardId: data.creditCardId,
                    categoryId: data.categoryId,
                    amount: new Decimal(-Math.abs(installmentAmount)),
                    description: `${data.description} (${i}/${data.totalInstallments})`,
                    type: 'expense',
                    date: installmentDate,
                    paymentMethod: 'CREDIT_CARD',
                    installmentGroupId,
                    installmentNumber: i,
                    totalInstallments: data.totalInstallments,
                },
            });

            transactions.push(transaction);
        }

        // Atualizar saldo do cartão
        await this.updateCreditCardBalance(data.creditCardId);

        // Registrar em AuditLog
        await this.logAudit({
            userId: data.userId,
            entityType: 'Transaction',
            entityId: installmentGroupId,
            action: 'CREATE_INSTALLMENT',
            newValue: JSON.stringify({ totalInstallments: data.totalInstallments, transactions }),
        });

        return transactions;
    }

    /**
     * Cria despesa compartilhada
     * Requirements: 4.2, 4.3, 4.4, 4.5
     */
    async createSharedExpense(data: SharedExpenseInput): Promise<any> {
        // Validar despesa compartilhada
        const validation = await validationService.validateSharedExpense(data);
        if (!validation.isValid) {
            throw validation.errors[0];
        }

        // Criar transação principal
        const transaction = await prisma.transaction.create({
            data: {
                userId: data.userId,
                accountId: data.accountId,
                creditCardId: data.creditCardId,
                categoryId: data.categoryId,
                amount: new Decimal(data.amount),
                description: data.description,
                type: data.type,
                date: data.date,
                paymentMethod: data.paymentMethod,
                isShared: true,
                sharedWith: JSON.stringify(data.sharedWith),
                totalSharedAmount: new Decimal(Math.abs(data.amount)),
                tripId: data.tripId,
            },
        });

        // Criar registros de SharedExpense para cada participante
        for (const participant of data.sharedWith) {
            await prisma.sharedExpense.create({
                data: {
                    transactionId: transaction.id,
                    userId: participant.userId,
                    accountId: data.accountId || '',
                    shareAmount: new Decimal(participant.amount),
                    sharePercentage: new Decimal((participant.amount / Math.abs(data.amount)) * 100),
                    status: 'PENDING',
                },
            });
        }

        // Atualizar saldo
        if (data.accountId) {
            await this.updateAccountBalance(data.accountId);
        }
        if (data.creditCardId) {
            await this.updateCreditCardBalance(data.creditCardId);
        }

        // Registrar em AuditLog
        await this.logAudit({
            userId: data.userId,
            entityType: 'Transaction',
            entityId: transaction.id,
            action: 'CREATE_SHARED',
            newValue: JSON.stringify(transaction),
        });

        return transaction;
    }

    /**
     * Cria transferência entre contas
     * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
     */
    async createTransfer(data: TransferInput): Promise<any[]> {
        // Validar transferência
        const validation = await validationService.validateTransfer(data);
        if (!validation.isValid) {
            throw validation.errors[0];
        }

        const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Usar transação atômica do Prisma
        const transactions = await prisma.$transaction(async (tx) => {
            // Criar transação de saída
            const outTransaction = await tx.transaction.create({
                data: {
                    userId: data.userId,
                    accountId: data.fromAccountId,
                    amount: new Decimal(-Math.abs(data.amount)),
                    description: data.description || 'Transferência enviada',
                    type: 'transfer',
                    date: data.date,
                    paymentMethod: 'ACCOUNT',
                    isTransfer: true,
                    transferId,
                    transferType: 'OUT',
                },
            });

            // Criar transação de entrada
            const inTransaction = await tx.transaction.create({
                data: {
                    userId: data.userId,
                    accountId: data.toAccountId,
                    amount: new Decimal(Math.abs(data.amount)),
                    description: data.description || 'Transferência recebida',
                    type: 'transfer',
                    date: data.date,
                    paymentMethod: 'ACCOUNT',
                    isTransfer: true,
                    transferId,
                    transferType: 'IN',
                },
            });

            return [outTransaction, inTransaction];
        });

        // Atualizar saldos das contas
        await this.updateAccountBalance(data.fromAccountId);
        await this.updateAccountBalance(data.toAccountId);

        // Registrar em AuditLog
        await this.logAudit({
            userId: data.userId,
            entityType: 'Transaction',
            entityId: transferId,
            action: 'CREATE_TRANSFER',
            newValue: JSON.stringify(transactions),
        });

        return transactions;
    }

    /**
     * Atualiza uma transação
     * Requirements: 11.1, 11.2
     */
    async updateTransaction(id: string, userId: string, data: UpdateTransactionData): Promise<any> {
        // Buscar transação original
        const original = await prisma.transaction.findFirst({
            where: { id, userId },
        });

        if (!original) {
            throw new ValidationError('id', 'Transação não encontrada', 'NOT_FOUND');
        }

        // Registrar valores antigos para auditoria
        const oldValues: any = {};
        const newValues: any = {};

        if (data.amount !== undefined && data.amount !== Number(original.amount)) {
            oldValues.amount = original.amount;
            newValues.amount = data.amount;
        }
        if (data.description && data.description !== original.description) {
            oldValues.description = original.description;
            newValues.description = data.description;
        }

        // Atualizar transação
        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                amount: data.amount !== undefined ? new Decimal(data.amount) : undefined,
                description: data.description,
                date: data.date,
                categoryId: data.categoryId,
                accountId: data.accountId,
                creditCardId: data.creditCardId,
            },
        });

        // Registrar alterações em AuditLog
        for (const [field, oldValue] of Object.entries(oldValues)) {
            await this.logAudit({
                userId,
                entityType: 'Transaction',
                entityId: id,
                action: 'UPDATE',
                fieldName: field,
                oldValue: String(oldValue),
                newValue: String(newValues[field]),
            });
        }

        // Recalcular saldos se necessário
        if (data.amount !== undefined || data.accountId || data.creditCardId) {
            if (original.accountId) {
                await this.updateAccountBalance(original.accountId);
            }
            if (updated.accountId && updated.accountId !== original.accountId) {
                await this.updateAccountBalance(updated.accountId);
            }
            if (original.creditCardId) {
                await this.updateCreditCardBalance(original.creditCardId);
            }
            if (updated.creditCardId && updated.creditCardId !== original.creditCardId) {
                await this.updateCreditCardBalance(updated.creditCardId);
            }
        }

        return updated;
    }

    /**
     * Exclui uma transação
     * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
     */
    async deleteTransaction(id: string, userId: string, options?: DeleteOptions): Promise<void> {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });

        if (!transaction) {
            throw new ValidationError('id', 'Transação não encontrada', 'NOT_FOUND');
        }

        // Se é parte de grupo de parcelas
        if (transaction.installmentGroupId) {
            if (options?.deleteAll) {
                // Excluir todas as parcelas do grupo
                await prisma.transaction.updateMany({
                    where: {
                        installmentGroupId: transaction.installmentGroupId,
                        userId,
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                });
            } else {
                // Excluir apenas esta parcela
                await prisma.transaction.update({
                    where: { id },
                    data: { deletedAt: new Date() },
                });
            }
        }
        // Se é transferência
        else if (transaction.isTransfer && transaction.transferId) {
            // Excluir ambas as transações da transferência
            await prisma.transaction.updateMany({
                where: {
                    transferId: transaction.transferId,
                    userId,
                },
                data: {
                    deletedAt: new Date(),
                },
            });
        }
        // Transação simples
        else {
            await prisma.transaction.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        }

        // Atualizar saldos
        if (transaction.accountId) {
            await this.updateAccountBalance(transaction.accountId);
        }
        if (transaction.creditCardId) {
            await this.updateCreditCardBalance(transaction.creditCardId);
        }

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Transaction',
            entityId: id,
            action: 'DELETE',
            oldValue: JSON.stringify(transaction),
        });
    }

    /**
     * Marca transação como reconciliada
     * Requirements: 17.1, 17.2, 17.3
     */
    async reconcileTransaction(id: string, userId: string): Promise<any> {
        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                isReconciled: true,
                reconciledAt: new Date(),
            },
        });

        // Atualizar reconciledBalance da conta
        if (transaction.accountId) {
            const reconciledSum = await prisma.transaction.aggregate({
                where: {
                    accountId: transaction.accountId,
                    isReconciled: true,
                    deletedAt: null,
                },
                _sum: {
                    amount: true,
                },
            });

            await prisma.account.update({
                where: { id: transaction.accountId },
                data: {
                    reconciledBalance: reconciledSum._sum.amount || new Decimal(0),
                },
            });
        }

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Transaction',
            entityId: id,
            action: 'RECONCILE',
        });

        return transaction;
    }

    /**
     * Atualiza saldo de uma conta
     */
    private async updateAccountBalance(accountId: string): Promise<void> {
        // Nota: balance foi removido do schema, então este método
        // pode ser usado para outras atualizações futuras se necessário
        // Por enquanto, apenas mantemos para compatibilidade
    }

    /**
     * Atualiza saldo de um cartão de crédito
     */
    private async updateCreditCardBalance(creditCardId: string): Promise<void> {
        const sum = await prisma.transaction.aggregate({
            where: {
                creditCardId,
                deletedAt: null,
            },
            _sum: {
                amount: true,
            },
        });

        await prisma.creditCard.update({
            where: { id: creditCardId },
            data: {
                currentBalance: sum._sum.amount || new Decimal(0),
            },
        });
    }

    /**
     * Adiciona anexo a uma transação
     * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
     */
    async addAttachment(
        transactionId: string,
        userId: string,
        file: {
            fileName: string;
            fileSize: number;
            fileType: string;
            fileUrl: string;
        }
    ): Promise<any> {
        // Validar tamanho do arquivo (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.fileSize > maxSize) {
            throw new ValidationError('fileSize', 'Arquivo muito grande. Máximo: 5MB', 'FILE_TOO_LARGE');
        }

        // Validar que transação existe e pertence ao usuário
        const transaction = await prisma.transaction.findFirst({
            where: { id: transactionId, userId },
        });

        if (!transaction) {
            throw new ValidationError('transactionId', 'Transação não encontrada', 'NOT_FOUND');
        }

        // Criar anexo
        const attachment = await prisma.attachment.create({
            data: {
                transactionId,
                userId,
                fileName: file.fileName,
                fileSize: file.fileSize,
                fileType: file.fileType,
                fileUrl: file.fileUrl,
            },
        });

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Attachment',
            entityId: attachment.id,
            action: 'CREATE',
            newValue: JSON.stringify(attachment),
        });

        return attachment;
    }

    /**
     * Remove anexo de uma transação
     * Requirements: 20.5
     */
    async removeAttachment(attachmentId: string, userId: string): Promise<void> {
        const attachment = await prisma.attachment.findFirst({
            where: { id: attachmentId, userId },
        });

        if (!attachment) {
            throw new ValidationError('attachmentId', 'Anexo não encontrado', 'NOT_FOUND');
        }

        // Excluir anexo do banco
        await prisma.attachment.delete({
            where: { id: attachmentId },
        });

        // TODO: Excluir arquivo do storage (local ou cloud)
        // await storageService.deleteFile(attachment.fileUrl);

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Attachment',
            entityId: attachmentId,
            action: 'DELETE',
            oldValue: JSON.stringify(attachment),
        });
    }

    /**
     * Adiciona tag a uma transação
     * Requirements: 21.1, 21.2, 21.4, 21.5
     */
    async addTag(transactionId: string, userId: string, tagName: string, tagColor?: string): Promise<void> {
        // Validar que transação existe e pertence ao usuário
        const transaction = await prisma.transaction.findFirst({
            where: { id: transactionId, userId },
        });

        if (!transaction) {
            throw new ValidationError('transactionId', 'Transação não encontrada', 'NOT_FOUND');
        }

        // Buscar ou criar tag
        let tag = await prisma.tag.findFirst({
            where: {
                userId,
                name: tagName,
            },
        });

        if (!tag) {
            tag = await prisma.tag.create({
                data: {
                    userId,
                    name: tagName,
                    color: tagColor || '#3B82F6',
                },
            });
        }

        // Verificar se já existe a associação
        const existing = await prisma.transactionTag.findUnique({
            where: {
                transactionId_tagId: {
                    transactionId,
                    tagId: tag.id,
                },
            },
        });

        if (existing) {
            return; // Já existe, não fazer nada
        }

        // Criar associação
        await prisma.transactionTag.create({
            data: {
                transactionId,
                tagId: tag.id,
            },
        });

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'TransactionTag',
            entityId: `${transactionId}_${tag.id}`,
            action: 'CREATE',
            newValue: JSON.stringify({ transactionId, tagId: tag.id, tagName }),
        });
    }

    /**
     * Remove tag de uma transação
     * Requirements: 21.5
     */
    async removeTag(transactionId: string, userId: string, tagId: string): Promise<void> {
        // Validar que transação existe e pertence ao usuário
        const transaction = await prisma.transaction.findFirst({
            where: { id: transactionId, userId },
        });

        if (!transaction) {
            throw new ValidationError('transactionId', 'Transação não encontrada', 'NOT_FOUND');
        }

        // Remover associação
        await prisma.transactionTag.delete({
            where: {
                transactionId_tagId: {
                    transactionId,
                    tagId,
                },
            },
        });

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'TransactionTag',
            entityId: `${transactionId}_${tagId}`,
            action: 'DELETE',
        });
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
export const transactionService = new TransactionService();

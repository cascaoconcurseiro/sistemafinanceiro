/**
 * AccountService - Serviço de gerenciamento de contas
 *
 * Responsável por gerenciar contas bancárias, calcular saldos,
 * reconciliação e exclusão com opções.
 */

import { prisma } from '@/lib/prisma';
import { ValidationError } from './validation-service';
import { Decimal } from '@prisma/client/runtime/library';

export interface BalanceInfo {
    calculated: number;
    reconciled: number;
    difference: number;
}

export interface DeletionValidation {
    canDelete: boolean;
    transactionCount: number;
    options: {
        deleteAll: boolean;
        keepTransactions: boolean;
        cancel: boolean;
    };
}

export interface DeleteAccountOptions {
    deleteAll?: boolean;
    keepTransactions?: boolean;
    targetAccountId?: string; // Para reatribuir transações
}

export interface ReconciliationResult {
    systemBalance: number;
    bankBalance: number;
    difference: number;
    unreconciledTransactions: any[];
}

export class AccountService {
    /**
     * Calcula saldo de uma conta
     * Requirements: 9.1, 9.4
     */
    async calculateBalance(accountId: string, userId: string): Promise<BalanceInfo> {
        // Validar que conta existe e pertence ao usuário
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId },
        });

        if (!account) {
            throw new ValidationError('accountId', 'Conta não encontrada', 'NOT_FOUND');
        }

        // Calcular saldo total (soma de todas as transações)
        const totalResult = await prisma.transaction.aggregate({
            where: {
                accountId,
                deletedAt: null,
            },
            _sum: {
                amount: true,
            },
        });

        const calculated = Number(totalResult._sum.amount || 0);

        // Calcular saldo reconciliado
        const reconciledResult = await prisma.transaction.aggregate({
            where: {
                accountId,
                deletedAt: null,
                isReconciled: true,
            },
            _sum: {
                amount: true,
            },
        });

        const reconciled = Number(reconciledResult._sum.amount || 0);

        return {
            calculated,
            reconciled,
            difference: calculated - reconciled,
        };
    }

    /**
     * Valida se conta pode ser excluída
     * Requirements: 1.3, 1.4, 8.1, 8.2
     */
    async validateAccountDeletion(accountId: string, userId: string): Promise<DeletionValidation> {
        // Contar transações vinculadas
        const transactionCount = await prisma.transaction.count({
            where: {
                accountId,
                userId,
                deletedAt: null,
            },
        });

        return {
            canDelete: true, // Sempre pode excluir, mas com opções
            transactionCount,
            options: {
                deleteAll: true, // Excluir tudo em cascata
                keepTransactions: true, // Manter transações, reatribuir para conta arquivada
                cancel: true, // Cancelar operação
            },
        };
    }

    /**
     * Exclui uma conta com opções
     * Requirements: 1.5, 8.3, 8.5
     */
    async deleteAccount(accountId: string, userId: string, options: DeleteAccountOptions): Promise<void> {
        // Validar que conta existe e pertence ao usuário
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId },
        });

        if (!account) {
            throw new ValidationError('accountId', 'Conta não encontrada', 'NOT_FOUND');
        }

        if (options.deleteAll) {
            // Excluir tudo em cascata (soft delete)
            await prisma.transaction.updateMany({
                where: { accountId, userId },
                data: { deletedAt: new Date() },
            });

            await prisma.account.update({
                where: { id: accountId },
                data: { deletedAt: new Date(), isActive: false },
            });
        } else if (options.keepTransactions) {
            // Reatribuir transações para outra conta
            if (!options.targetAccountId) {
                throw new ValidationError('targetAccountId', 'Conta destino é obrigatória', 'REQUIRED');
            }

            // Validar que conta destino existe
            const targetAccount = await prisma.account.findFirst({
                where: { id: options.targetAccountId, userId },
            });

            if (!targetAccount) {
                throw new ValidationError('targetAccountId', 'Conta destino não encontrada', 'NOT_FOUND');
            }

            // Reatribuir transações
            await prisma.transaction.updateMany({
                where: { accountId, userId },
                data: { accountId: options.targetAccountId },
            });

            // Excluir conta
            await prisma.account.update({
                where: { id: accountId },
                data: { deletedAt: new Date(), isActive: false },
            });
        }

        // Registrar em AuditLog
        await this.logAudit({
            userId,
            entityType: 'Account',
            entityId: accountId,
            action: 'DELETE',
            oldValue: JSON.stringify({ account, options }),
        });
    }

    /**
     * Reconcilia conta com saldo bancário
     * Requirements: 17.3, 17.4, 17.5
     */
    async reconcileAccount(accountId: string, userId: string, bankBalance: number): Promise<ReconciliationResult> {
        // Calcular saldo do sistema
        const balanceInfo = await this.calculateBalance(accountId, userId);

        // Buscar transações não reconciliadas
        const unreconciledTransactions = await prisma.transaction.findMany({
            where: {
                accountId,
                userId,
                deletedAt: null,
                isReconciled: false,
            },
            orderBy: { date: 'desc' },
            take: 50, // Limitar a 50 transações
        });

        return {
            systemBalance: balanceInfo.calculated,
            bankBalance,
            difference: balanceInfo.calculated - bankBalance,
            unreconciledTransactions,
        };
    }

    /**
     * Transfere dinheiro entre contas
     * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
     */
    async transferBetweenAccounts(
        fromAccountId: string,
        toAccountId: string,
        amount: number,
        userId: string,
        description?: string
    ): Promise<any[]> {
        // Usar o TransactionService para criar a transferência
        const { transactionService } = await import('./transaction-service');

        return transactionService.createTransfer({
            userId,
            fromAccountId,
            toAccountId,
            amount,
            description: description || 'Transferência entre contas',
            date: new Date(),
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
export const accountService = new AccountService();

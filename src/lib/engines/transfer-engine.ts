import { storage } from '@/lib/config/storage';
import type { Transaction, Account } from './data-layer/types';
import { v4 as uuidv4 } from 'uuid';

interface TransferRequest {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: Date;
}

interface TransferResult {
  success: boolean;
  error?: string;
  transferId?: string;
  outTransaction?: Transaction;
  inTransaction?: Transaction;
}

interface Transfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
  outTransactionId: string;
  inTransactionId: string;
  createdAt: string;
}

class TransferEngine {
  async createTransfer(request: TransferRequest): Promise<TransferResult> {
    console.log('💸 Criando transferência...', {
      from: request.fromAccountId,
      to: request.toAccountId,
      amount: request.amount,
    });

    try {
      // Validar contas
      const accounts = storage.getAccounts();
      const fromAccount = accounts.find(a => a.id === request.fromAccountId);
      const toAccount = accounts.find(a => a.id === request.toAccountId);

      if (!fromAccount) {
        return { success: false, error: 'Conta de origem não encontrada' };
      }

      if (!toAccount) {
        return { success: false, error: 'Conta de destino não encontrada' };
      }

      if (fromAccount.id === toAccount.id) {
        return { success: false, error: 'Conta de origem e destino não podem ser iguais' };
      }

      if (request.amount <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' };
      }

      // Verificar saldo suficiente
      if (fromAccount.balance < request.amount) {
        return { success: false, error: 'Saldo insuficiente na conta de origem' };
      }

      const transferId = uuidv4();
      const dateString = request.date.toISOString().split('T')[0];

      // Criar transação de saída (débito na conta origem)
      const outTransaction: Transaction = {
        id: uuidv4(),
        amount: -Math.abs(request.amount), // Negativo para saída
        description: `Transferência para ${toAccount.name}: ${request.description}`,
        category: 'Transferências',
        date: dateString,
        type: 'expense',
        account: fromAccount.id,
        notes: `Transfer ID: ${transferId}`,
        transferId,
        transferType: 'out',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Criar transação de entrada (crédito na conta destino)
      const inTransaction: Transaction = {
        id: uuidv4(),
        amount: Math.abs(request.amount), // Positivo para entrada
        description: `Transferência de ${fromAccount.name}: ${request.description}`,
        category: 'Transferências',
        date: dateString,
        type: 'income',
        account: toAccount.id,
        notes: `Transfer ID: ${transferId}`,
        transferId,
        transferType: 'in',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Salvar transações
      storage.saveTransaction(outTransaction);
      storage.saveTransaction(inTransaction);

      // Atualizar saldos das contas
      storage.updateAccount(fromAccount.id, {
        balance: fromAccount.balance - request.amount,
      });

      storage.updateAccount(toAccount.id, {
        balance: toAccount.balance + request.amount,
      });

      // Salvar registro da transferência
      const transfer: Transfer = {
        id: transferId,
        userId: request.userId,
        fromAccountId: request.fromAccountId,
        toAccountId: request.toAccountId,
        amount: request.amount,
        description: request.description,
        date: dateString,
        outTransactionId: outTransaction.id,
        inTransactionId: inTransaction.id,
        createdAt: new Date().toISOString(),
      };

      this.saveTransfer(transfer);

      console.log('✅ Transferência criada com sucesso:', {
        transferId,
        fromAccount: fromAccount.name,
        toAccount: toAccount.name,
        amount: request.amount,
      });

      return {
        success: true,
        transferId,
        outTransaction,
        inTransaction,
      };

    } catch (error) {
      console.error('❌ Erro ao criar transferência:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async listTransfers(userId: string, limit: number = 50): Promise<Transfer[]> {
    try {
      const transfers = this.getTransfers();
      return transfers
        .filter(t => t.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Erro ao listar transferências:', error);
      return [];
    }
  }

  async getTransferById(transferId: string): Promise<Transfer | null> {
    try {
      const transfers = this.getTransfers();
      return transfers.find(t => t.id === transferId) || null;
    } catch (error) {
      console.error('❌ Erro ao buscar transferência:', error);
      return null;
    }
  }

  async reverseTransfer(transferId: string, userId: string): Promise<TransferResult> {
    
    try {
      const transfer = await this.getTransferById(transferId);
      if (!transfer) {
        return { success: false, error: 'Transferência não encontrada' };
      }

      if (transfer.userId !== userId) {
        return { success: false, error: 'Não autorizado' };
      }

      // Criar transferência reversa
      const reverseResult = await this.createTransfer({
        userId,
        fromAccountId: transfer.toAccountId,
        toAccountId: transfer.fromAccountId,
        amount: transfer.amount,
        description: `Reversão: ${transfer.description}`,
        date: new Date(),
      });

      if (reverseResult.success) {
              }

      return reverseResult;

    } catch (error) {
      console.error('❌ Erro ao reverter transferência:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private saveTransfer(transfer: Transfer): void {
    const transfers = this.getTransfers();
    transfers.push(transfer);

    if (typeof window !== 'undefined') {
      localStorage.setItem('transfers', JSON.stringify(transfers));
    }
  }

  private getTransfers(): Transfer[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem('transfers');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar transferências:', error);
      return [];
    }
  }

  async getTransferStats(userId: string, period: 'month' | 'year' = 'month'): Promise<{
    totalTransfers: number;
    totalAmount: number;
    averageAmount: number;
    mostUsedAccounts: Array<{ accountId: string; accountName: string; count: number }>;
  }> {
    try {
      const transfers = await this.listTransfers(userId, 1000);
      const accounts = storage.getAccounts();

      // Filtrar por período
      const now = new Date();
      const startDate = new Date();
      if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const filteredTransfers = transfers.filter(t =>
        new Date(t.createdAt) >= startDate
      );

      const totalTransfers = filteredTransfers.length;
      const totalAmount = filteredTransfers.reduce((sum, t) => sum + t.amount, 0);
      const averageAmount = totalTransfers > 0 ? totalAmount / totalTransfers : 0;

      // Contar uso de contas
      const accountUsage = new Map<string, number>();
      filteredTransfers.forEach(t => {
        accountUsage.set(t.fromAccountId, (accountUsage.get(t.fromAccountId) || 0) + 1);
        accountUsage.set(t.toAccountId, (accountUsage.get(t.toAccountId) || 0) + 1);
      });

      const mostUsedAccounts = Array.from(accountUsage.entries())
        .map(([accountId, count]) => {
          const account = accounts.find(a => a.id === accountId);
          return {
            accountId,
            accountName: account?.name || 'Conta Desconhecida',
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalTransfers,
        totalAmount,
        averageAmount,
        mostUsedAccounts,
      };

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        totalTransfers: 0,
        totalAmount: 0,
        averageAmount: 0,
        mostUsedAccounts: [],
      };
    }
  }
}

export const transferEngine = new TransferEngine();

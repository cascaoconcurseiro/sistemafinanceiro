/**
 * ADAPTADOR DE BANCO DE DADOS POSTGRESQL/NEON
 * Gerencia todas as operações de banco de dados
 */

import { prisma } from '../prisma';
import { Account, Transaction, CreditCard, Budget, SystemEvent } from '../../types/database';

// Event bus simples para eventos do sistema
const eventBus = {
  emit: (event: string, data: any) => {
    console.log(`📡 Evento: ${event}`, data);
  }
};

class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private connected = false;

  private constructor() {
    // Usa o singleton do PrismaClient
  }

  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  /**
   * Testa conexão com banco de dados
   */
  public async testConnection(): Promise<void> {
    try {
      // Verifica se está rodando no browser
      if (typeof window !== 'undefined') {
        console.warn('⚠️ PrismaClient não pode rodar no browser - usando mock para testes');
        this.connected = true;
        return;
      }

      await prisma.$connect();
      this.connected = true;
      console.log('✅ Conectado ao banco PostgreSQL/Neon');
    } catch (error) {
      this.connected = false;
      console.error('❌ Erro de conexão com banco:', error);
      throw error;
    }
  }

  /**
   * Verifica se está conectado
   */
  public isConnected(): boolean {
    return this.connected;
  }

  // ==================== CONTAS ====================

  /**
   * Busca todas as contas
   */
  public async getAccounts(): Promise<Account[]> {
    try {
      const accounts = await prisma.account.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      eventBus.emit('data:accounts:fetched', { count: accounts.length });
      return accounts as Account[];
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw new Error('Falha ao buscar contas do banco de dados');
    }
  }

  /**
   * Cria nova conta
   */
  public async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    try {
      const account = await prisma.account.create({
        data: {
          ...accountData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      eventBus.emit('data:account:created', account);
      return account as Account;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw new Error('Falha ao criar conta no banco de dados');
    }
  }

  /**
   * Atualiza conta
   */
  public async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    try {
      const account = await prisma.account.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      eventBus.emit('data:account:updated', account);
      return account as Account;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      throw new Error('Falha ao atualizar conta no banco de dados');
    }
  }

  /**
   * Remove conta (soft delete)
   */
  public async deleteAccount(id: string): Promise<void> {
    try {
      await prisma.account.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      eventBus.emit('data:account:deleted', { id });
    } catch (error) {
      console.error('Erro ao remover conta:', error);
      throw new Error('Falha ao remover conta do banco de dados');
    }
  }

  // ==================== TRANSAÇÕES ====================

  /**
   * Busca todas as transações
   */
  public async getTransactions(accountId?: string): Promise<Transaction[]> {
    try {
      const where = accountId ? { accountId } : {};
      
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      eventBus.emit('data:transactions:fetched', { count: transactions.length, accountId });
      return transactions as Transaction[];
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Falha ao buscar transações do banco de dados');
    }
  }

  /**
   * Cria nova transação
   */
  public async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          ...transactionData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Atualiza saldo da conta
      await this.updateAccountBalance(transactionData.accountId);

      eventBus.emit('data:transaction:created', transaction);
      return transaction as Transaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Falha ao criar transação no banco de dados');
    }
  }

  /**
   * Atualiza transação
   */
  public async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const oldTransaction = await prisma.transaction.findUnique({ where: { id } });
      
      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // Atualiza saldo das contas afetadas
      if (oldTransaction) {
        await this.updateAccountBalance(oldTransaction.accountId);
      }
      if (updates.accountId && updates.accountId !== oldTransaction?.accountId) {
        await this.updateAccountBalance(updates.accountId);
      }

      eventBus.emit('data:transaction:updated', transaction);
      return transaction as Transaction;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw new Error('Falha ao atualizar transação no banco de dados');
    }
  }

  /**
   * Remove transação
   */
  public async deleteTransaction(id: string): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({ where: { id } });
      
      await prisma.transaction.delete({ where: { id } });

      // Atualiza saldo da conta
      if (transaction) {
        await this.updateAccountBalance(transaction.accountId);
      }

      eventBus.emit('data:transaction:deleted', { id });
    } catch (error) {
      console.error('Erro ao remover transação:', error);
      throw new Error('Falha ao remover transação do banco de dados');
    }
  }

  // ==================== CARTÕES DE CRÉDITO ====================

  /**
   * Busca todos os cartões de crédito
   */
  public async getCreditCards(): Promise<CreditCard[]> {
    try {
      const cards = await prisma.creditCard.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      eventBus.emit('data:creditCards:fetched', { count: cards.length });
      return cards as CreditCard[];
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      throw new Error('Falha ao buscar cartões do banco de dados');
    }
  }

  /**
   * Cria novo cartão de crédito
   */
  public async createCreditCard(cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreditCard> {
    try {
      const card = await prisma.creditCard.create({
        data: {
          ...cardData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      eventBus.emit('data:creditCard:created', card);
      return card as CreditCard;
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      throw new Error('Falha ao criar cartão no banco de dados');
    }
  }

  // ==================== ORÇAMENTOS ====================

  /**
   * Busca todos os orçamentos
   */
  public async getBudgets(): Promise<Budget[]> {
    try {
      const budgets = await prisma.budget.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      eventBus.emit('data:budgets:fetched', { count: budgets.length });
      return budgets as Budget[];
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      throw new Error('Falha ao buscar orçamentos do banco de dados');
    }
  }

  /**
   * Cria novo orçamento
   */
  public async createBudget(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const budget = await prisma.budget.create({
        data: {
          ...budgetData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      eventBus.emit('data:budget:created', budget);
      return budget as Budget;
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      throw new Error('Falha ao criar orçamento no banco de dados');
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Atualiza saldo da conta baseado nas transações
   */
  public async updateAccountBalance(accountId: string): Promise<void> {
    try {
      // Usar a função de recálculo mais robusta
      const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
      const newBalance = await recalculateAccountBalance(accountId);

      await prisma.account.update({
        where: { id: accountId },
        data: { 
          balance: newBalance,
          updatedAt: new Date()
        }
      });

      eventBus.emit('data:account:balance:updated', { accountId, balance: newBalance });
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
    }
  }

  /**
   * Registra evento do sistema
   */
  public async logSystemEvent(event: SystemEvent): Promise<void> {
    try {
      await prisma.systemLog.create({
        data: {
          type: event.type,
          data: JSON.stringify(event.data),
          timestamp: new Date(event.timestamp || new Date())
        }
      });
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
    }
  }

  /**
   * Limpa todos os dados (para testes)
   */
  public async clearAllData(): Promise<void> {
    try {
      // Buscar todas as contas antes de limpar para recalcular saldos
      const accounts = await prisma.account.findMany({ select: { id: true } });
      
      await prisma.transaction.deleteMany();
      await prisma.budget.deleteMany();
      await prisma.creditCard.deleteMany();
      
      // Recalcular saldos de todas as contas (que devem ficar zerados)
      const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
      for (const account of accounts) {
        await recalculateAccountBalance(account.id);
      }
      
      await prisma.account.deleteMany();
      
      eventBus.emit('data:all:cleared', {});
      console.log('🧹 Todos os dados foram limpos do banco');
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw new Error('Falha ao limpar dados do banco');
    }
  }

  /**
   * Fecha conexão com banco
   */
  public async disconnect(): Promise<void> {
    await prisma.$disconnect();
    this.connected = false;
  }
}

// Singleton instance
export const databaseAdapter = DatabaseAdapter.getInstance();

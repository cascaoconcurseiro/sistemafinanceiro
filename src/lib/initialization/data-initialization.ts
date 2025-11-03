'use client';

import { Account, Transaction, Goal } from '@/types';
import { databaseService } from './services/database-service';

export interface InitialDataConfig {
  createAccounts: boolean;
  createTransactions: boolean;
  createGoals: boolean;
}

export class DataInitializer {
  private static instance: DataInitializer;
  private readonly INIT_FLAG_KEY = 'sua-grana-initialized';

  static getInstance(): DataInitializer {
    if (!DataInitializer.instance) {
      DataInitializer.instance = new DataInitializer();
    }
    return DataInitializer.instance;
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  async isInitialized(): Promise<boolean> {
    try {
      // Check if we have any data in the system to determine initialization status
      const accounts = await databaseService.getAccounts();
      return accounts.length > 0;
    } catch (error) {
      // Sistema não inicializado se não conseguir acessar dados
      return false;
    }
  }

  // Método removido - inicialização é determinada pela presença de dados no banco
  // markAsInitialized(): void {
  //   console.warn('markAsInitialized() é deprecado - use apenas dados do banco de dados');
  // }

  createDefaultAccounts(): Account[] {
    const accounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Conta Corrente',
        type: 'checking',
        // balance removed - calculated dynamically from transactions
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-2',
        name: 'Poupança',
        type: 'savings',
        // balance removed - calculated dynamically from transactions
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-3',
        name: 'Cartão de Crédito',
        type: 'credit',
        // balance removed - calculated dynamically from transactions
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return accounts;
  }

  createDefaultTransactions(accounts: Account[]): Transaction[] {
    const transactions: Transaction[] = [
      // Receitas - Total: R$ 12.000,00
      {
        id: 'trans-1',
        description: 'Salário',
        amount: 8000,
        date: '2025-09-01',
        category: 'Salário',
        type: 'income',
        accountId: accounts[0].id, // Conta Corrente
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trans-2',
        description: 'Freelance',
        amount: 2500,
        date: '2025-09-05',
        category: 'Freelance',
        type: 'income',
        accountId: accounts[0].id, // Conta Corrente
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trans-3',
        description: 'Rendimento Poupança',
        amount: 1500,
        date: '2025-09-15',
        category: 'Investimentos',
        type: 'income',
        accountId: accounts[1].id, // Poupança
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },

      // Despesas - Total: R$ 2.550,00
      {
        id: 'trans-4',
        description: 'Supermercado',
        amount: -450,
        date: '2025-09-02',
        category: 'Alimentação',
        type: 'expense',
        accountId: accounts[0].id, // Conta Corrente
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trans-5',
        description: 'Aluguel',
        amount: -1200,
        date: '2025-09-06',
        category: 'Moradia',
        type: 'expense',
        accountId: accounts[0].id, // Conta Corrente
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trans-6',
        description: 'Conta de Luz',
        amount: -180,
        date: '2025-09-10',
        category: 'Utilidades',
        type: 'expense',
        accountId: accounts[0].id, // Conta Corrente
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trans-7',
        description: 'Gasolina',
        amount: -250,
        date: '2025-09-12',
        category: 'Transporte',
        type: 'expense',
        accountId: accounts[0].id, // Conta Corrente
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'trans-8',
        description: 'Compras no Cartão',
        amount: -470,
        date: '2025-09-08',
        category: 'Compras',
        type: 'expense',
        accountId: accounts[2].id, // Cartão de Crédito
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },

      // Saldo Total: R$ 12.000,00 - R$ 2.550,00 = R$ 9.450,00
    ];

    return transactions;
  }

  createDefaultGoals(): Goal[] {
    const goals: Goal[] = [
      {
        id: 'goal-1',
        title: 'Reserva de Emergência',
        targetAmount: 10000,
        currentAmount: 2000,
        deadline: '2025-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'goal-2',
        title: 'Viagem de Férias',
        targetAmount: 5000,
        currentAmount: 800,
        deadline: '2025-07-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return goals;
  }

  async initializeDefaultData(config: InitialDataConfig = {
    createAccounts: true,
    createTransactions: true,
    createGoals: true,
  }): Promise<{
    accounts: Account[];
    transactions: Transaction[];
    goals: Goal[];
  }> {
    if (!this.isClient()) {
      console.warn('initializeDefaultData() - Operação apenas no cliente');
      return { accounts: [], transactions: [], goals: [] };
    }

    let accounts: Account[] = [];
    let transactions: Transaction[] = [];
    let goals: Goal[] = [];

    try {
      // Create accounts first
      if (config.createAccounts) {
        accounts = this.createDefaultAccounts();
        await databaseService.saveAccounts(accounts);
      }

      // Create transactions with valid accountIds
      if (config.createTransactions && accounts.length > 0) {
        transactions = this.createDefaultTransactions(accounts);
        await databaseService.saveTransactions(transactions);
      }

      // Create goals
      if (config.createGoals) {
        goals = this.createDefaultGoals();
        // Note: saveGoals method needs to be implemented in DatabaseService
        console.warn('saveGoals() não implementado no DatabaseService ainda');
      }

      console.log('✅ Dados padrão inicializados com sucesso:', {
        accounts: accounts.length,
        transactions: transactions.length,
        goals: goals.length,
      });

      return { accounts, transactions, goals };
    } catch (error) {
      console.error('❌ Erro ao inicializar dados padrão:', error);
      return { accounts: [], transactions: [], goals: [] };
    }
  }

  async fixExistingTransactions(): Promise<void> {
    if (!this.isClient()) return;

    try {
      // Get existing data using DatabaseService
      const existingTransactions = await databaseService.getTransactions();
      const existingAccounts = await databaseService.getAccounts();

      // If no accounts exist, create them
      let accounts = existingAccounts;
      if (accounts.length === 0) {
        accounts = this.createDefaultAccounts();
        await databaseService.saveAccounts(accounts);
      }

      // Fix transactions without valid accountId and add status if missing
      const fixedTransactions = existingTransactions.map((transaction: Transaction) => {
        let updatedTransaction = { ...transaction };

        // Fix accountId if missing or invalid
        if (!transaction.accountId || !accounts.find((acc: Account) => acc.id === transaction.accountId)) {
          updatedTransaction.accountId = accounts[0]?.id || 'acc-1';
        }

        // Add status if missing (default to 'completed')
        if (!transaction.status) {
          updatedTransaction.status = 'completed';
        }

        return updatedTransaction;
      });

      // Save fixed transactions using DatabaseService
      await databaseService.saveTransactions(fixedTransactions);

      console.log('✅ Transações existentes corrigidas:', {
        total: fixedTransactions.length,
        fixed: fixedTransactions.filter((t: Transaction, i: number) =>
          t.accountId !== existingTransactions[i]?.accountId ||
          t.status !== existingTransactions[i]?.status
        ).length,
      });
    } catch (error) {
      console.error('❌ Erro ao corrigir transações existentes:', error);
    }
  }

  async resetAllData(): Promise<void> {
    if (!this.isClient()) return;

    try {
      // Clear all data using DatabaseService
      await databaseService.clearAllData();

          } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  }

  // Getter functions to retrieve data from DatabaseService
  async getAccounts(): Promise<Account[]> {
    if (!this.isClient()) return [];
    try {
      return await databaseService.getAccounts();
    } catch (error) {
      console.error('❌ Erro ao recuperar contas:', error);
      return [];
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.isClient()) return [];
    try {
      return await databaseService.getTransactions();
    } catch (error) {
      console.error('❌ Erro ao recuperar transações:', error);
      return [];
    }
  }

  async getGoals(): Promise<Goal[]> {
    if (!this.isClient()) return [];
    try {
      return await databaseService.getGoals();
    } catch (error) {
      console.error('❌ Erro ao recuperar metas:', error);
      return [];
    }
  }

  async getContacts(): Promise<any[]> {
    if (!this.isClient()) return [];
    try {
      // TODO: Implementar getContacts no DatabaseService
      console.warn('getContacts ainda não implementado no DatabaseService');
      return [];
    } catch (error) {
      console.error('❌ Erro ao recuperar contatos:', error);
      return [];
    }
  }

  async getTrips(): Promise<any[]> {
    if (!this.isClient()) return [];
    try {
      // TODO: Implementar getTrips no DatabaseService
      console.warn('getTrips ainda não implementado no DatabaseService');
      return [];
    } catch (error) {
      console.error('❌ Erro ao recuperar viagens:', error);
      return [];
    }
  }

  async getInvestments(): Promise<any[]> {
    if (!this.isClient()) return [];
    try {
      return await databaseService.getInvestments();
    } catch (error) {
      console.error('❌ Erro ao recuperar investimentos:', error);
      return [];
    }
  }

  async getSharedDebts(): Promise<any[]> {
    if (!this.isClient()) return [];
    try {
      // TODO: Implementar getSharedDebts no DatabaseService
      console.warn('getSharedDebts ainda não implementado no DatabaseService');
      return [];
    } catch (error) {
      console.error('❌ Erro ao recuperar dívidas compartilhadas:', error);
      return [];
    }
  }
}

export const dataInitializer = DataInitializer.getInstance();

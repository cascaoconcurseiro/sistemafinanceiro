/**
 * ADAPTADOR DE BANCO DE DADOS PARA O CLIENTE
 * 
 * Este adaptador funciona no lado do cliente fazendo chamadas para API routes
 * Substitui o database-adapter.ts que usa PrismaClient diretamente
 */

import { eventBus } from '../events/event-bus';

// Interfaces para dados financeiros (mantidas iguais)
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  usedAmount: number;
  dueDate: number;
  closingDate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemEvent {
  type: string;
  data: any;
  timestamp?: string;
}

class ClientDatabaseAdapter {
  private static instance: ClientDatabaseAdapter;
  private connected = false;

  private constructor() {
    // Não inicializa PrismaClient no cliente
  }

  public static getInstance(): ClientDatabaseAdapter {
    if (!ClientDatabaseAdapter.instance) {
      ClientDatabaseAdapter.instance = new ClientDatabaseAdapter();
    }
    return ClientDatabaseAdapter.instance;
  }

  // ==================== CONEXÃO ====================
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/database/health');
      const result = await response.json();
      this.connected = result.success;
      return this.connected;
    } catch (error) {
      console.error('Erro de conexão com banco:', error);
      this.connected = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ==================== CONTAS ====================
  
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Erro ao buscar contas');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      return [];
    }
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account | null> {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });
      if (!response.ok) throw new Error('Erro ao criar conta');
      const account = await response.json();
      eventBus.emit('accountCreated', account);
      return account;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      return null;
    }
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erro ao atualizar conta');
      const account = await response.json();
      eventBus.emit('accountUpdated', account);
      return account;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      return null;
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar conta');
      eventBus.emit('accountDeleted', { id });
      return true;
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      return false;
    }
  }

  // ==================== TRANSAÇÕES ====================
  
  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Erro ao buscar transações');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction | null> {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      if (!response.ok) throw new Error('Erro ao criar transação');
      const transaction = await response.json();
      eventBus.emit('transactionCreated', transaction);
      return transaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return null;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erro ao atualizar transação');
      const transaction = await response.json();
      eventBus.emit('transactionUpdated', transaction);
      return transaction;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return null;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar transação');
      eventBus.emit('transactionDeleted', { id });
      return true;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return false;
    }
  }

  // ==================== CARTÕES DE CRÉDITO ====================
  
  async getCreditCards(): Promise<CreditCard[]> {
    try {
      const response = await fetch('/api/credit-cards');
      if (!response.ok) throw new Error('Erro ao buscar cartões');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      return [];
    }
  }

  async createCreditCard(cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreditCard | null> {
    try {
      const response = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      if (!response.ok) throw new Error('Erro ao criar cartão');
      const card = await response.json();
      eventBus.emit('creditCardCreated', card);
      return card;
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      return null;
    }
  }

  // ==================== ORÇAMENTOS ====================
  
  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await fetch('/api/budgets');
      if (!response.ok) throw new Error('Erro ao buscar orçamentos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return [];
    }
  }

  // ==================== LOGS DE SISTEMA ====================
  
  async logSystemEvent(event: SystemEvent): Promise<void> {
    // TEMPORARIAMENTE DESABILITADO: A rota /api/audit/system-events não existe
    // e estava causando um loop infinito de erros
    console.log('🔇 Sistema de auditoria desabilitado temporariamente para evitar loop infinito');
    return;
    
    /* CÓDIGO ORIGINAL COMENTADO:
    try {
      await fetch('/api/audit/system-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: event.timestamp || new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Erro ao registrar evento:', error);
    }
    */
  }

  // ==================== UTILITÁRIOS ====================
  
  async clearAllData(): Promise<boolean> {
    try {
      const response = await fetch('/api/database/clear', {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await fetch('/api/database/stats');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  }
}

// Instância singleton
export const clientDatabaseAdapter = ClientDatabaseAdapter.getInstance();

// Export default para compatibilidade
export default clientDatabaseAdapter;

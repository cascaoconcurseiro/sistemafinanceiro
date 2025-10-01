export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  date: Date;
  tags?: string[];
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  bank?: string;
  accountNumber?: string;
}

export interface SharedExpense {
  id: string;
  title: string;
  totalAmount: number;
  participants: {
    id: string;
    name: string;
    email: string;
    amountOwed: number;
    amountPaid: number;
    isPaid: boolean;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'settled' | 'cancelled';
  description?: string;
  category?: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UnifiedFinancialSystem {
  private transactions: Transaction[] = [];
  private accounts: Account[] = [];
  private sharedExpenses: SharedExpense[] = [];
  private budgets: Budget[] = [];
  private goals: Goal[] = [];

  // Transaction methods
  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  getTransactionsByAccount(accountId: string): Transaction[] {
    return this.transactions.filter(t => t.accountId === accountId);
  }

  getTransactionsByCategory(category: string): Transaction[] {
    return this.transactions.filter(t => t.category === category);
  }

  getTransactionsByDateRange(startDate: Date, endDate: Date): Transaction[] {
    return this.transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.transactions[index] = {
      ...this.transactions[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.transactions[index];
  }

  deleteTransaction(id: string): boolean {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.transactions.splice(index, 1);
    return true;
  }

  // Account methods
  addAccount(account: Omit<Account, 'id'>): Account {
    const newAccount: Account = {
      ...account,
      id: this.generateId(),
    };
    
    this.accounts.push(newAccount);
    return newAccount;
  }

  getAccounts(): Account[] {
    return [...this.accounts];
  }

  getActiveAccounts(): Account[] {
    return this.accounts.filter(a => a.isActive);
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return null;

    this.accounts[index] = {
      ...this.accounts[index],
      ...updates,
    };

    return this.accounts[index];
  }

  // Shared Expense methods
  createSharedExpense(expense: Omit<SharedExpense, 'id' | 'createdAt' | 'updatedAt'>): SharedExpense {
    const newExpense: SharedExpense = {
      ...expense,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sharedExpenses.push(newExpense);
    return newExpense;
  }

  getSharedExpenses(): SharedExpense[] {
    return [...this.sharedExpenses];
  }

  updateSharedExpense(id: string, updates: Partial<SharedExpense>): SharedExpense | null {
    const index = this.sharedExpenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.sharedExpenses[index] = {
      ...this.sharedExpenses[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.sharedExpenses[index];
  }

  settleSharedExpense(id: string): boolean {
    const expense = this.sharedExpenses.find(e => e.id === id);
    if (!expense) return false;

    expense.status = 'settled';
    expense.updatedAt = new Date();
    return true;
  }

  // Budget methods
  createBudget(budget: Omit<Budget, 'id'>): Budget {
    const newBudget: Budget = {
      ...budget,
      id: this.generateId(),
    };
    
    this.budgets.push(newBudget);
    return newBudget;
  }

  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  getActiveBudgets(): Budget[] {
    return this.budgets.filter(b => b.isActive);
  }

  updateBudget(id: string, updates: Partial<Budget>): Budget | null {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) return null;

    this.budgets[index] = {
      ...this.budgets[index],
      ...updates,
    };

    return this.budgets[index];
  }

  // Goal methods
  createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.goals.push(newGoal);
    return newGoal;
  }

  getGoals(): Goal[] {
    return [...this.goals];
  }

  getActiveGoals(): Goal[] {
    return this.goals.filter(g => g.isActive);
  }

  updateGoal(id: string, updates: Partial<Goal>): Goal | null {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) return null;

    this.goals[index] = {
      ...this.goals[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.goals[index];
  }

  // Analytics methods
  getTotalBalance(): number {
    return this.getActiveAccounts().reduce((sum, account) => sum + account.balance, 0);
  }

  getMonthlyIncome(month?: number, year?: number): number {
    const now = new Date();
    const targetMonth = month ?? now.getMonth();
    const targetYear = year ?? now.getFullYear();

    return this.transactions
      .filter(t => 
        t.type === 'income' && 
        t.date.getMonth() === targetMonth && 
        t.date.getFullYear() === targetYear
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getMonthlyExpenses(month?: number, year?: number): number {
    const now = new Date();
    const targetMonth = month ?? now.getMonth();
    const targetYear = year ?? now.getFullYear();

    return this.transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === targetMonth && 
        t.date.getFullYear() === targetYear
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getCategorySpending(category: string, startDate?: Date, endDate?: Date): number {
    let filteredTransactions = this.transactions.filter(t => 
      t.category === category && t.type === 'expense'
    );

    if (startDate && endDate) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.date >= startDate && t.date <= endDate
      );
    }

    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Export/Import methods
  exportData() {
    return {
      transactions: this.transactions,
      accounts: this.accounts,
      sharedExpenses: this.sharedExpenses,
      budgets: this.budgets,
      goals: this.goals,
      exportedAt: new Date(),
    };
  }

  importData(data: any) {
    if (data.transactions) this.transactions = data.transactions;
    if (data.accounts) this.accounts = data.accounts;
    if (data.sharedExpenses) this.sharedExpenses = data.sharedExpenses;
    if (data.budgets) this.budgets = data.budgets;
    if (data.goals) this.goals = data.goals;
  }

  // Clear all data
  clearAllData() {
    this.transactions = [];
    this.accounts = [];
    this.sharedExpenses = [];
    this.budgets = [];
    this.goals = [];
  }
}

// Singleton instance
export const financialSystem = new UnifiedFinancialSystem();

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  accountId: string;
  toAccountId?: string; // For transfers
  date: string;
  tags?: string[];
  notes?: string;
  attachments?: string[];
  recurring?: RecurringConfig;
  installment?: InstallmentConfig;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate?: string;
  maxOccurrences?: number;
  nextDate?: string;
}

export interface InstallmentConfig {
  installmentNumber: number; // Current installment number (1, 2, 3...)
  totalInstallments: number; // Total number of installments
  parentTransactionId?: string; // ID of the parent transaction (for child installments)
  originalAmount?: number; // Original total amount (for parent transaction)
  isParent?: boolean; // True if this is the parent transaction
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  type?: Transaction['type'];
  category?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: Transaction['status'];
  tags?: string[];
  searchTerm?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  averageTransaction: number;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

export interface BulkOperation {
  type: 'update' | 'delete' | 'categorize';
  transactionIds: string[];
  updates?: Partial<Transaction>;
}

class TransactionManager {
  private readonly STORAGE_KEY = 'sua-grana-transactions';
  private readonly CATEGORIES_KEY = 'sua-grana-categories';

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private async getStorageData<T>(key: string): Promise<T[]> {
    try {
      if (key === this.STORAGE_KEY) {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const transactions = await response.json();
          return transactions as T[];
        }
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      return [];
    }
  }

  private async setStorageData<T>(key: string, data: T[]): Promise<void> {
    // Este método não é mais necessário pois salvamos via API
    console.log('setStorageData não é mais usado - dados salvos via API');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Transaction CRUD Operations
  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    let transactions = await this.getStorageData<Transaction>(this.STORAGE_KEY);

    if (!filter) return transactions;

    // Apply filters
    if (filter.startDate) {
      transactions = transactions.filter(t => t.date >= filter.startDate!);
    }
    if (filter.endDate) {
      transactions = transactions.filter(t => t.date <= filter.endDate!);
    }
    if (filter.type) {
      transactions = transactions.filter(t => t.type === filter.type);
    }
    if (filter.category) {
      transactions = transactions.filter(t => t.category === filter.category);
    }
    if (filter.accountId) {
      transactions = transactions.filter(t => 
        t.accountId === filter.accountId || t.toAccountId === filter.accountId
      );
    }
    if (filter.minAmount !== undefined) {
      transactions = transactions.filter(t => t.amount >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      transactions = transactions.filter(t => t.amount <= filter.maxAmount!);
    }
    if (filter.status) {
      transactions = transactions.filter(t => t.status === filter.status);
    }
    if (filter.tags && filter.tags.length > 0) {
      transactions = transactions.filter(t => 
        t.tags && t.tags.some(tag => filter.tags!.includes(tag))
      );
    }
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      transactions = transactions.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower))
      );
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const transactions = await this.getStorageData<Transaction>(this.STORAGE_KEY);
    return transactions.find(t => t.id === id) || null;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      // Mapear os dados para o formato da API
      const transactionData = {
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        type: transaction.type === 'expense' ? 'debit' : 'credit',
        category: transaction.category,
        accountId: transaction.accountId,
        date: transaction.date,
        status: transaction.status || 'cleared',
        tripId: (transaction as any).tripId,
        installmentNumber: transaction.installment?.installmentNumber,
        totalInstallments: transaction.installment?.totalInstallments
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar transação');
      }

      const savedTransaction = await response.json();
      
      // Converter de volta para o formato do Transaction
      const convertedTransaction: Transaction = {
        ...savedTransaction,
        type: savedTransaction.type === 'debit' ? 'expense' : 'income',
        accountId: savedTransaction.accountId,
        status: savedTransaction.status || 'completed',
        installment: transaction.installment
      };

      return convertedTransaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getStorageData<Transaction>(this.STORAGE_KEY);
    const transactionIndex = transactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) return null;

    transactions[transactionIndex] = {
      ...transactions[transactionIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.setStorageData(this.STORAGE_KEY, transactions);
    return transactions[transactionIndex];
  }

  deleteTransaction(id: string): boolean {
    const transactions = this.getStorageData<Transaction>(this.STORAGE_KEY);
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) return false;

    this.setStorageData(this.STORAGE_KEY, filteredTransactions);
    return true;
  }

  // Bulk Operations
  bulkUpdate(operation: BulkOperation): { success: number; failed: number } {
    const transactions = this.getStorageData<Transaction>(this.STORAGE_KEY);
    let success = 0;
    let failed = 0;

    operation.transactionIds.forEach(id => {
      const transactionIndex = transactions.findIndex(t => t.id === id);
      
      if (transactionIndex !== -1) {
        switch (operation.type) {
          case 'update':
            if (operation.updates) {
              transactions[transactionIndex] = {
                ...transactions[transactionIndex],
                ...operation.updates,
                updatedAt: new Date().toISOString(),
              };
              success++;
            } else {
              failed++;
            }
            break;
          case 'delete':
            transactions.splice(transactionIndex, 1);
            success++;
            break;
          case 'categorize':
            if (operation.updates?.category) {
              transactions[transactionIndex].category = operation.updates.category;
              transactions[transactionIndex].updatedAt = new Date().toISOString();
              success++;
            } else {
              failed++;
            }
            break;
        }
      } else {
        failed++;
      }
    });

    this.setStorageData(this.STORAGE_KEY, transactions);
    return { success, failed };
  }

  // Transaction Analysis
  getTransactionSummary(filter?: TransactionFilter): TransactionSummary {
    const transactions = this.getTransactions(filter);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netAmount = totalIncome - totalExpenses;
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    transactions.forEach(t => {
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = 0;
      }
      categoryBreakdown[t.category] += t.amount;
    });

    // Monthly trend
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else if (t.type === 'expense') {
        monthlyData[monthKey].expenses += t.amount;
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount,
      averageTransaction,
      categoryBreakdown,
      monthlyTrend,
    };
  }

  // Recurring Transactions
  createRecurringTransaction(
    baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    recurringConfig: RecurringConfig
  ): Transaction {
    const transaction: Transaction = {
      ...baseTransaction,
      id: this.generateId(),
      recurring: {
        ...recurringConfig,
        enabled: true,
        nextDate: this.calculateNextRecurringDate({
          ...baseTransaction,
          recurring: recurringConfig,
        } as Transaction)?.toISOString().split('T')[0],
      },
      tags: [...(baseTransaction.tags || []), 'recurring'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.createTransaction(transaction);
    return transaction;
  }

  updateRecurringTransaction(transactionId: string, updates: Partial<Transaction>): void {
    const transaction = this.getTransactionById(transactionId);
    if (!transaction?.recurring) {
      throw new Error('Transação não é recorrente');
    }

    // If recurring config is being updated, recalculate next date
    if (updates.recurring) {
      const newRecurringConfig = { ...transaction.recurring, ...updates.recurring };
      updates.recurring = {
        ...newRecurringConfig,
        nextDate: this.calculateNextRecurringDate({
          ...transaction,
          ...updates,
          recurring: newRecurringConfig,
        } as Transaction)?.toISOString().split('T')[0],
      };
    }

    this.updateTransaction(transactionId, updates);
  }

  stopRecurringTransaction(transactionId: string): void {
    const transaction = this.getTransactionById(transactionId);
    if (!transaction?.recurring) {
      throw new Error('Transação não é recorrente');
    }

    this.updateTransaction(transactionId, {
      recurring: {
        ...transaction.recurring,
        enabled: false,
        nextDate: undefined,
      },
    });
  }

  getRecurringTransactions(): Transaction[] {
    const allTransactions = this.getTransactions();
    return allTransactions.filter(t => t.recurring?.enabled);
  }

  private scheduleNextRecurringTransaction(transaction: Transaction): void {
    if (!transaction.recurring?.enabled) return;

    const nextDate = this.calculateNextRecurringDate(transaction);
    if (nextDate) {
      // Update the recurring config with next date
      this.updateTransaction(transaction.id, {
        recurring: {
          ...transaction.recurring,
          nextDate: nextDate.toISOString().split('T')[0],
        },
      });
    } else {
      // Stop recurring if no more dates
      this.stopRecurringTransaction(transaction.id);
    }
  }

  private calculateNextRecurringDate(transaction: Transaction): Date | null {
    if (!transaction.recurring?.enabled) return null;

    const currentDate = new Date(transaction.recurring.nextDate || transaction.date);
    const { frequency, interval } = transaction.recurring;

    let nextDate = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }

    // Check if we've reached the end date
    if (transaction.recurring.endDate && nextDate > new Date(transaction.recurring.endDate)) {
      return null;
    }

    // Check if we've reached max occurrences
    if (transaction.recurring.maxOccurrences) {
      const allTransactions = this.getTransactions();
      const recurringCount = allTransactions.filter(t => 
        t.tags?.includes('recurring') && 
        t.description === transaction.description &&
        t.amount === transaction.amount
      ).length;
      
      if (recurringCount >= transaction.recurring.maxOccurrences) {
        return null;
      }
    }

    return nextDate;
  }

  processRecurringTransactions(): Transaction[] {
    const transactions = this.getStorageData<Transaction>(this.STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    const newTransactions: Transaction[] = [];

    transactions.forEach(transaction => {
      if (
        transaction.recurring?.enabled &&
        transaction.recurring.nextDate &&
        transaction.recurring.nextDate <= today
      ) {
        // Create new transaction
        const newTransaction = this.createTransaction({
          ...transaction,
          id: undefined as any, // Will be generated
          date: transaction.recurring.nextDate,
          createdAt: undefined as any, // Will be generated
          updatedAt: undefined as any, // Will be generated
        });

        newTransactions.push(newTransaction);

        // Schedule next occurrence
        this.scheduleNextRecurringTransaction(newTransaction);
      }
    });

    return newTransactions;
  }

  // Categories Management
  getCategories(): string[] {
    return this.getStorageData<string>(this.CATEGORIES_KEY);
  }

  addCategory(category: string): void {
    const categories = this.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      this.setStorageData(this.CATEGORIES_KEY, categories);
    }
  }

  removeCategory(category: string): void {
    const categories = this.getCategories().filter(c => c !== category);
    this.setStorageData(this.CATEGORIES_KEY, categories);
  }

  // Import/Export
  exportTransactions(filter?: TransactionFilter): string {
    const transactions = this.getTransactions(filter);
    return JSON.stringify(transactions, null, 2);
  }

  importTransactions(data: string): { success: number; failed: number; errors: string[] } {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      const importedTransactions = JSON.parse(data) as Transaction[];
      
      if (!Array.isArray(importedTransactions)) {
        result.errors.push('Dados devem ser um array de transações');
        return result;
      }

      importedTransactions.forEach((transaction, index) => {
        try {
          // Validate required fields
          if (!transaction.description || !transaction.amount || !transaction.date) {
            result.errors.push(`Transação ${index + 1}: campos obrigatórios faltando`);
            result.failed++;
            return;
          }

          // Create transaction (will generate new ID)
          this.createTransaction({
            type: transaction.type || 'expense',
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category || 'Outros',
            accountId: transaction.accountId || 'default',
            date: transaction.date,
            status: transaction.status || 'completed',
            tags: transaction.tags,
            notes: transaction.notes,
            subcategory: transaction.subcategory,
            toAccountId: transaction.toAccountId,
            attachments: transaction.attachments,
            recurring: transaction.recurring,
          });

          result.success++;
        } catch (error) {
          result.errors.push(`Transação ${index + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          result.failed++;
        }
      });
    } catch (error) {
      result.errors.push('Erro ao analisar dados JSON');
      result.failed = 1;
    }

    return result;
  }

  // Search and Filtering
  searchTransactions(query: string): Transaction[] {
    return this.getTransactions({
      searchTerm: query,
    });
  }

  getTransactionsByCategory(category: string): Transaction[] {
    return this.getTransactions({
      category,
    });
  }

  getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    return this.getTransactions({
      startDate,
      endDate,
    });
  }

  // Statistics
  getSpendingByCategory(startDate?: string, endDate?: string): Record<string, number> {
    const transactions = this.getTransactions({
      type: 'expense',
      startDate,
      endDate,
    });

    const spending: Record<string, number> = {};
    transactions.forEach(t => {
      spending[t.category] = (spending[t.category] || 0) + t.amount;
    });

    return spending;
  }

  getIncomeByCategory(startDate?: string, endDate?: string): Record<string, number> {
    const transactions = this.getTransactions({
      type: 'income',
      startDate,
      endDate,
    });

    const income: Record<string, number> = {};
    transactions.forEach(t => {
      income[t.category] = (income[t.category] || 0) + t.amount;
    });

    return income;
  }

  // Validation
  validateTransaction(transaction: Partial<Transaction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transaction.description || transaction.description.trim() === '') {
      errors.push('Descrição é obrigatória');
    }

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!transaction.date) {
      errors.push('Data é obrigatória');
    }

    if (!transaction.category || transaction.category.trim() === '') {
      errors.push('Categoria é obrigatória');
    }

    if (!transaction.accountId || transaction.accountId.trim() === '') {
      errors.push('Conta é obrigatória');
    }

    if (transaction.type === 'transfer' && !transaction.toAccountId) {
      errors.push('Conta de destino é obrigatória para transferências');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Installment Transactions
  async createInstallmentTransaction(
    baseTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    totalInstallments: number,
    startDate?: string
  ): Promise<Transaction[]> {
    if (totalInstallments < 2) {
      throw new Error('Número de parcelas deve ser maior que 1');
    }

    const installmentAmount = Math.round((baseTransaction.amount / totalInstallments) * 100) / 100;
    const transactions: Transaction[] = [];
    const baseDate = new Date(startDate || baseTransaction.date);

    // Create only the first installment as a regular transaction
    const firstInstallmentDate = new Date(baseDate);
    const firstInstallmentTransaction = {
      ...baseTransaction,
      amount: installmentAmount,
      date: firstInstallmentDate.toISOString().split('T')[0],
      description: `${baseTransaction.description} (1/${totalInstallments})`,
      installment: {
        installmentNumber: 1,
        totalInstallments,
        originalAmount: baseTransaction.amount,
        isParent: true,
      },
      tags: [...(baseTransaction.tags || []), 'installment'],
    };

    // Create the first installment via API
    const firstTransaction = await this.createTransaction(firstInstallmentTransaction);
    transactions.push(firstTransaction);

    // If it's a shared transaction, create billing payments for the first installment
    if ((baseTransaction as any).isShared && (baseTransaction as any).sharedWith && (baseTransaction as any).sharedWith.length > 0) {
      const transactionForBilling = {
        ...firstTransaction,
        sharedWith: (baseTransaction as any).sharedWith,
        amount: installmentAmount
      };
      
      // Import storage dynamically to avoid circular dependency
      const { storage } = await import('../lib/storage');
      storage.createBillingPayments(transactionForBilling);
    }

    // Schedule the remaining installments
    for (let i = 2; i <= totalInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

      // Adjust last installment to handle rounding differences
      const currentAmount = i === totalInstallments 
        ? baseTransaction.amount - (installmentAmount * (totalInstallments - 1))
        : installmentAmount;

      const scheduledTransaction = {
        description: `${baseTransaction.description} (${i}/${totalInstallments})`,
        amount: currentAmount,
        type: baseTransaction.type,
        category: baseTransaction.category,
        accountId: baseTransaction.accountId,
        scheduledDate: installmentDate,
        parentTransactionId: firstTransaction.id,
        installmentNumber: i,
        totalInstallments,
        tripId: baseTransaction.tripId,
        sharedWith: (baseTransaction as any).sharedWith ? JSON.stringify((baseTransaction as any).sharedWith) : null,
        notes: `Parcela ${i} de ${totalInstallments} - ${baseTransaction.description}`,
      };

      // Create scheduled transaction via API
      await fetch('/api/scheduled-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduledTransaction),
      });
    }

    return transactions;
  }

  getInstallmentTransactions(parentTransactionId: string): Transaction[] {
    const allTransactions = this.getTransactions();
    return allTransactions.filter(t => 
      t.installment?.parentTransactionId === parentTransactionId ||
      (t.installment?.isParent && t.id === parentTransactionId)
    );
  }

  updateInstallmentTransaction(transactionId: string, updates: Partial<Transaction>): void {
    const transaction = this.getTransactionById(transactionId);
    if (!transaction?.installment) {
      throw new Error('Transação não é um parcelamento');
    }

    // If updating a child installment, update only that installment
    if (!transaction.installment.isParent) {
      this.updateTransaction(transactionId, updates);
      return;
    }

    // If updating parent, update all installments
    const installments = this.getInstallmentTransactions(transactionId);
    const childInstallments = installments.filter(t => !t.installment?.isParent);

    if (updates.amount && transaction.installment.originalAmount) {
      const newInstallmentAmount = Math.round((updates.amount / transaction.installment.totalInstallments) * 100) / 100;
      
      childInstallments.forEach((installment, index) => {
        const isLast = index === childInstallments.length - 1;
        const currentAmount = isLast 
          ? updates.amount! - (newInstallmentAmount * (childInstallments.length - 1))
          : newInstallmentAmount;

        this.updateTransaction(installment.id, {
          ...updates,
          amount: currentAmount,
          description: updates.description 
            ? `${updates.description} (${installment.installment?.installmentNumber}/${installment.installment?.totalInstallments})`
            : installment.description,
        });
      });
    } else {
      childInstallments.forEach(installment => {
        this.updateTransaction(installment.id, {
          ...updates,
          description: updates.description 
            ? `${updates.description} (${installment.installment?.installmentNumber}/${installment.installment?.totalInstallments})`
            : installment.description,
        });
      });
    }

    // Update parent transaction
    this.updateTransaction(transactionId, {
      ...updates,
      description: updates.description 
        ? `${updates.description} (Total: ${transaction.installment.totalInstallments}x)`
        : transaction.description,
    });
  }

  deleteInstallmentTransaction(transactionId: string, deleteAll: boolean = false): void {
    const transaction = this.getTransactionById(transactionId);
    if (!transaction?.installment) {
      throw new Error('Transação não é um parcelamento');
    }

    if (deleteAll || transaction.installment.isParent) {
      // Delete all installments
      const installments = this.getInstallmentTransactions(
        transaction.installment.isParent ? transactionId : transaction.installment.parentTransactionId!
      );
      installments.forEach(t => this.deleteTransaction(t.id));
    } else {
      // Delete only this installment
      this.deleteTransaction(transactionId);
    }
  }
}

// Export singleton instance
export const transactionManager = new TransactionManager();

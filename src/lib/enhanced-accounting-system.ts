export interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference?: string;
  category?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChartOfAccounts {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  level: number;
  isActive: boolean;
  // balance removed - calculated dynamically from journal entries
  description?: string;
}

export interface TrialBalance {
  account: ChartOfAccounts;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
}

export interface FinancialStatement {
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  period: {
    start: string;
    end: string;
  };
  data: Record<string, number>;
  totals: {
    assets?: number;
    liabilities?: number;
    equity?: number;
    revenue?: number;
    expenses?: number;
    netIncome?: number;
  };
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  entries: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  createdAt: string;
  createdBy?: string;
}

class EnhancedAccountingSystem {
  private readonly STORAGE_KEYS = {
    CHART_OF_ACCOUNTS: 'accounting-chart-of-accounts',
    JOURNAL_ENTRIES: 'accounting-journal-entries',
    ACCOUNTING_ENTRIES: 'accounting-entries',
  };

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getStorageData<T>(key: string): T[] {
    // Dados agora vêm do banco de dados, não do localStorage
    console.warn(`getStorageData(${key}) - localStorage removido, use banco de dados`);
    return [];
  }

  private setStorageData<T>(key: string, data: T[]): void {
    // Dados agora são salvos no banco de dados, não do localStorage
    console.warn(`setStorageData(${key}) - localStorage removido, use banco de dados`);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Chart of Accounts Management
  getChartOfAccounts(): ChartOfAccounts[] {
    return this.getStorageData<ChartOfAccounts>(this.STORAGE_KEYS.CHART_OF_ACCOUNTS);
  }

  createAccount(account: Omit<ChartOfAccounts, 'id'>): ChartOfAccounts {
    const accounts = this.getChartOfAccounts();
    const newAccount: ChartOfAccounts = {
      ...account,
      id: this.generateId(),
      // balance removed - calculated dynamically from journal entries
    };

    accounts.push(newAccount);
    this.setStorageData(this.STORAGE_KEYS.CHART_OF_ACCOUNTS, accounts);
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<ChartOfAccounts>): ChartOfAccounts | null {
    const accounts = this.getChartOfAccounts();
    const accountIndex = accounts.findIndex(acc => acc.id === id);
    
    if (accountIndex === -1) return null;

    accounts[accountIndex] = { ...accounts[accountIndex], ...updates };
    this.setStorageData(this.STORAGE_KEYS.CHART_OF_ACCOUNTS, accounts);
    return accounts[accountIndex];
  }

  deleteAccount(id: string): boolean {
    const accounts = this.getChartOfAccounts();
    const filteredAccounts = accounts.filter(acc => acc.id !== id);
    
    if (filteredAccounts.length === accounts.length) return false;

    this.setStorageData(this.STORAGE_KEYS.CHART_OF_ACCOUNTS, filteredAccounts);
    return true;
  }

  // Journal Entry Management
  getJournalEntries(): JournalEntry[] {
    return this.getStorageData<JournalEntry>(this.STORAGE_KEYS.JOURNAL_ENTRIES);
  }

  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'totalDebits' | 'totalCredits' | 'isBalanced' | 'createdAt'>): JournalEntry {
    const totalDebits = entry.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = entry.entries.reduce((sum, e) => sum + e.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const newEntry: JournalEntry = {
      ...entry,
      id: this.generateId(),
      totalDebits,
      totalCredits,
      isBalanced,
      createdAt: new Date().toISOString(),
    };

    const entries = this.getJournalEntries();
    entries.push(newEntry);
    this.setStorageData(this.STORAGE_KEYS.JOURNAL_ENTRIES, entries);

    // Update account balances
    if (isBalanced) {
      this.updateAccountBalances(newEntry);
    }

    return newEntry;
  }

  private updateAccountBalances(journalEntry: JournalEntry): void {
    // REMOVED: Balance updates are no longer stored in accounts
    // All balances are calculated dynamically from transactions
    // This follows the core logic of personal finance systems
    
    // Note: This method is kept for compatibility but does nothing
    // Consider removing calls to this method in the future
  }

  private isDebitAccount(type: ChartOfAccounts['type']): boolean {
    return type === 'asset' || type === 'expense';
  }

  // Trial Balance
  generateTrialBalance(asOfDate?: string): TrialBalance[] {
    const accounts = this.getChartOfAccounts();
    const journalEntries = this.getJournalEntries();

    const filteredEntries = asOfDate 
      ? journalEntries.filter(entry => entry.date <= asOfDate)
      : journalEntries;

    const trialBalance: TrialBalance[] = accounts.map(account => {
      let debitBalance = 0;
      let creditBalance = 0;

      filteredEntries.forEach(journalEntry => {
        journalEntry.entries.forEach(entry => {
          if (entry.accountId === account.id) {
            debitBalance += entry.debit;
            creditBalance += entry.credit;
          }
        });
      });

      const netBalance = this.isDebitAccount(account.type) 
        ? debitBalance - creditBalance
        : creditBalance - debitBalance;

      return {
        account,
        debitBalance,
        creditBalance,
        netBalance,
      };
    });

    return trialBalance.filter(tb => tb.debitBalance !== 0 || tb.creditBalance !== 0);
  }

  // Financial Statements
  generateBalanceSheet(asOfDate: string): FinancialStatement {
    const trialBalance = this.generateTrialBalance(asOfDate);
    const data: Record<string, number> = {};
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    trialBalance.forEach(tb => {
      data[tb.account.name] = tb.netBalance;
      
      switch (tb.account.type) {
        case 'asset':
          totalAssets += tb.netBalance;
          break;
        case 'liability':
          totalLiabilities += tb.netBalance;
          break;
        case 'equity':
          totalEquity += tb.netBalance;
          break;
      }
    });

    return {
      type: 'balance_sheet',
      period: { start: '', end: asOfDate },
      data,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
      },
    };
  }

  generateIncomeStatement(startDate: string, endDate: string): FinancialStatement {
    const journalEntries = this.getJournalEntries().filter(
      entry => entry.date >= startDate && entry.date <= endDate
    );
    
    const accounts = this.getChartOfAccounts();
    const data: Record<string, number> = {};
    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts.forEach(account => {
      if (account.type === 'revenue' || account.type === 'expense') {
        let balance = 0;
        
        journalEntries.forEach(journalEntry => {
          journalEntry.entries.forEach(entry => {
            if (entry.accountId === account.id) {
              if (account.type === 'revenue') {
                balance += entry.credit - entry.debit;
              } else {
                balance += entry.debit - entry.credit;
              }
            }
          });
        });

        if (balance !== 0) {
          data[account.name] = balance;
          
          if (account.type === 'revenue') {
            totalRevenue += balance;
          } else {
            totalExpenses += balance;
          }
        }
      }
    });

    const netIncome = totalRevenue - totalExpenses;

    return {
      type: 'income_statement',
      period: { start: startDate, end: endDate },
      data,
      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome,
      },
    };
  }

  // Account Analysis
  getAccountLedger(accountId: string, startDate?: string, endDate?: string): Array<{
    date: string;
    description: string;
    reference?: string;
    debit: number;
    credit: number;
    balance: number;
  }> {
    const journalEntries = this.getJournalEntries();
    const ledgerEntries: Array<{
      date: string;
      description: string;
      reference?: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    let runningBalance = 0;
    const account = this.getChartOfAccounts().find(acc => acc.id === accountId);
    
    if (!account) return [];

    const filteredEntries = journalEntries
      .filter(entry => {
        if (startDate && entry.date < startDate) return false;
        if (endDate && entry.date > endDate) return false;
        return entry.entries.some(e => e.accountId === accountId);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    filteredEntries.forEach(journalEntry => {
      journalEntry.entries.forEach(entry => {
        if (entry.accountId === accountId) {
          const balanceChange = this.isDebitAccount(account.type)
            ? entry.debit - entry.credit
            : entry.credit - entry.debit;
          
          runningBalance += balanceChange;

          ledgerEntries.push({
            date: journalEntry.date,
            description: entry.description || journalEntry.description,
            reference: journalEntry.reference,
            debit: entry.debit,
            credit: entry.credit,
            balance: runningBalance,
          });
        }
      });
    });

    return ledgerEntries;
  }

  // Accounting Ratios
  calculateFinancialRatios(asOfDate: string): Record<string, number> {
    const balanceSheet = this.generateBalanceSheet(asOfDate);
    const incomeStatement = this.generateIncomeStatement(
      new Date(new Date(asOfDate).getFullYear(), 0, 1).toISOString().split('T')[0],
      asOfDate
    );

    const ratios: Record<string, number> = {};

    // Liquidity Ratios
    const currentAssets = this.getAccountsByType('asset', balanceSheet.data);
    const currentLiabilities = this.getAccountsByType('liability', balanceSheet.data);
    
    if (currentLiabilities > 0) {
      ratios.currentRatio = currentAssets / currentLiabilities;
    }

    // Profitability Ratios
    if (balanceSheet.totals.assets && balanceSheet.totals.assets > 0) {
      ratios.returnOnAssets = (incomeStatement.totals.netIncome || 0) / balanceSheet.totals.assets;
    }

    if (balanceSheet.totals.equity && balanceSheet.totals.equity > 0) {
      ratios.returnOnEquity = (incomeStatement.totals.netIncome || 0) / balanceSheet.totals.equity;
    }

    // Leverage Ratios
    if (balanceSheet.totals.assets && balanceSheet.totals.assets > 0) {
      ratios.debtToAssets = (balanceSheet.totals.liabilities || 0) / balanceSheet.totals.assets;
    }

    if (balanceSheet.totals.equity && balanceSheet.totals.equity > 0) {
      ratios.debtToEquity = (balanceSheet.totals.liabilities || 0) / balanceSheet.totals.equity;
    }

    return ratios;
  }

  private getAccountsByType(type: ChartOfAccounts['type'], data: Record<string, number>): number {
    const accounts = this.getChartOfAccounts();
    return accounts
      .filter(acc => acc.type === type)
      .reduce((sum, acc) => sum + (data[acc.name] || 0), 0);
  }

  // Initialize default chart of accounts
  initializeDefaultChartOfAccounts(): void {
    const existingAccounts = this.getChartOfAccounts();
    if (existingAccounts.length > 0) return;

    const defaultAccounts: Omit<ChartOfAccounts, 'id' | 'balance'>[] = [
      // Assets
      { code: '1000', name: 'Caixa', type: 'asset', level: 1, isActive: true },
      { code: '1100', name: 'Banco Conta Corrente', type: 'asset', level: 1, isActive: true },
      { code: '1200', name: 'Banco Poupança', type: 'asset', level: 1, isActive: true },
      { code: '1300', name: 'Investimentos', type: 'asset', level: 1, isActive: true },
      { code: '1400', name: 'Contas a Receber', type: 'asset', level: 1, isActive: true },
      
      // Liabilities
      { code: '2000', name: 'Contas a Pagar', type: 'liability', level: 1, isActive: true },
      { code: '2100', name: 'Cartão de Crédito', type: 'liability', level: 1, isActive: true },
      { code: '2200', name: 'Financiamentos', type: 'liability', level: 1, isActive: true },
      
      // Equity
      { code: '3000', name: 'Capital Próprio', type: 'equity', level: 1, isActive: true },
      { code: '3100', name: 'Lucros Acumulados', type: 'equity', level: 1, isActive: true },
      
      // Revenue
      { code: '4000', name: 'Salário', type: 'revenue', level: 1, isActive: true },
      { code: '4100', name: 'Rendimentos de Investimentos', type: 'revenue', level: 1, isActive: true },
      { code: '4200', name: 'Outras Receitas', type: 'revenue', level: 1, isActive: true },
      
      // Expenses
      { code: '5000', name: 'Alimentação', type: 'expense', level: 1, isActive: true },
      { code: '5100', name: 'Transporte', type: 'expense', level: 1, isActive: true },
      { code: '5200', name: 'Moradia', type: 'expense', level: 1, isActive: true },
      { code: '5300', name: 'Saúde', type: 'expense', level: 1, isActive: true },
      { code: '5400', name: 'Educação', type: 'expense', level: 1, isActive: true },
      { code: '5500', name: 'Lazer', type: 'expense', level: 1, isActive: true },
    ];

    defaultAccounts.forEach(account => {
      this.createAccount(account);
    });
  }

  // Validation
  validateJournalEntry(entry: Omit<JournalEntry, 'id' | 'totalDebits' | 'totalCredits' | 'isBalanced' | 'createdAt'>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if entries exist
    if (!entry.entries || entry.entries.length === 0) {
      errors.push('Pelo menos uma entrada é necessária');
    }

    // Check if debits equal credits
    const totalDebits = entry.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = entry.entries.reduce((sum, e) => sum + e.credit, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push('Total de débitos deve ser igual ao total de créditos');
    }

    // Check if all accounts exist
    const accounts = this.getChartOfAccounts();
    entry.entries.forEach((entryItem, index) => {
      const accountExists = accounts.some(acc => acc.id === entryItem.accountId);
      if (!accountExists) {
        errors.push(`Conta não encontrada na entrada ${index + 1}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const enhancedAccountingSystem = new EnhancedAccountingSystem();

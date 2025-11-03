import { storage } from './storage';
import type { Transaction, Account } from './data-layer/types';

interface TrialBalanceAccount {
  accountId: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
}

interface TrialBalance {
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: string;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  debits: Array<{
    accountId: string;
    accountName: string;
    amount: number;
  }>;
  credits: Array<{
    accountId: string;
    accountName: string;
    amount: number;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

class DoubleEntryEngine {
  private getAccountType(accountName: string): 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' {
    // Mapear tipos de conta baseado no nome/categoria
    const assetKeywords = ['conta', 'banco', 'caixa', 'dinheiro', 'carteira', 'poupança', 'investimento'];
    const liabilityKeywords = ['cartão', 'crédito', 'empréstimo', 'financiamento', 'dívida'];
    const revenueKeywords = ['receita', 'salário', 'renda', 'income'];
    const expenseKeywords = ['despesa', 'gasto', 'expense'];

    const lowerName = accountName.toLowerCase();

    if (assetKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'asset';
    }
    if (liabilityKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'liability';
    }
    if (revenueKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'revenue';
    }
    if (expenseKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'expense';
    }

    // Default para ativo se não conseguir determinar
    return 'asset';
  }

  private createJournalEntry(transaction: Transaction): JournalEntry {
    const accounts = storage.getAccounts();
    const account = accounts.find(a => a.id === transaction.account || a.name === transaction.account);
    const accountName = account?.name || transaction.account || 'Conta Desconhecida';
    const amount = Math.abs(transaction.amount);

    const entry: JournalEntry = {
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      reference: `TXN-${transaction.id}`,
      debits: [],
      credits: [],
      totalDebits: 0,
      totalCredits: 0,
      isBalanced: false,
    };

    if (transaction.type === 'income') {
      // Receita: Débito na conta (ativo) e Crédito na receita
      entry.debits.push({
        accountId: transaction.account || 'unknown',
        accountName,
        amount,
      });
      entry.credits.push({
        accountId: 'revenue-' + (transaction.category || 'other'),
        accountName: `Receita - ${transaction.category || 'Outras'}`,
        amount,
      });
    } else if (transaction.type === 'expense') {
      // Despesa: Débito na despesa e Crédito na conta (ativo)
      entry.debits.push({
        accountId: 'expense-' + (transaction.category || 'other'),
        accountName: `Despesa - ${transaction.category || 'Outras'}`,
        amount,
      });
      entry.credits.push({
        accountId: transaction.account || 'unknown',
        accountName,
        amount,
      });
    }

    entry.totalDebits = entry.debits.reduce((sum, d) => sum + d.amount, 0);
    entry.totalCredits = entry.credits.reduce((sum, c) => sum + c.amount, 0);
    entry.isBalanced = Math.abs(entry.totalDebits - entry.totalCredits) < 0.01;

    return entry;
  }

  async generateTrialBalance(): Promise<TrialBalance> {
    
    const transactions = storage.getTransactions();
    const accounts = storage.getAccounts();
    const accountBalances = new Map<string, TrialBalanceAccount>();

    // Inicializar contas reais
    for (const account of accounts) {
      const accountType = this.getAccountType(account.name);
      accountBalances.set(account.id, {
        accountId: account.id,
        accountName: account.name,
        accountType,
        debitBalance: 0,
        creditBalance: 0,
        netBalance: account.balance,
      });
    }

    // Processar transações
    for (const transaction of transactions) {
      const entry = this.createJournalEntry(transaction);

      // Processar débitos
      for (const debit of entry.debits) {
        if (!accountBalances.has(debit.accountId)) {
          const accountType = debit.accountId.startsWith('expense-') ? 'expense' :
                            debit.accountId.startsWith('revenue-') ? 'revenue' : 'asset';
          accountBalances.set(debit.accountId, {
            accountId: debit.accountId,
            accountName: debit.accountName,
            accountType,
            debitBalance: 0,
            creditBalance: 0,
            netBalance: 0,
          });
        }

        const account = accountBalances.get(debit.accountId)!;
        account.debitBalance += debit.amount;
      }

      // Processar créditos
      for (const credit of entry.credits) {
        if (!accountBalances.has(credit.accountId)) {
          const accountType = credit.accountId.startsWith('expense-') ? 'expense' :
                            credit.accountId.startsWith('revenue-') ? 'revenue' : 'asset';
          accountBalances.set(credit.accountId, {
            accountId: credit.accountId,
            accountName: credit.accountName,
            accountType,
            debitBalance: 0,
            creditBalance: 0,
            netBalance: 0,
          });
        }

        const account = accountBalances.get(credit.accountId)!;
        account.creditBalance += credit.amount;
      }
    }

    // Calcular saldos líquidos
    const accountsArray = Array.from(accountBalances.values());
    for (const account of accountsArray) {
      // Para ativos e despesas: saldo = débitos - créditos
      // Para passivos, patrimônio e receitas: saldo = créditos - débitos
      if (account.accountType === 'asset' || account.accountType === 'expense') {
        account.netBalance = account.debitBalance - account.creditBalance;
      } else {
        account.netBalance = account.creditBalance - account.debitBalance;
      }
    }

    const totalDebits = accountsArray.reduce((sum, acc) => sum + acc.debitBalance, 0);
    const totalCredits = accountsArray.reduce((sum, acc) => sum + acc.creditBalance, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const trialBalance: TrialBalance = {
      accounts: accountsArray.sort((a, b) => a.accountName.localeCompare(b.accountName)),
      totalDebits,
      totalCredits,
      isBalanced,
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Balancete gerado:', {
      totalAccounts: accountsArray.length,
      totalDebits,
      totalCredits,
      isBalanced,
    });

    return trialBalance;
  }

  async generateJournalEntries(startDate?: string, endDate?: string): Promise<JournalEntry[]> {
    
    let transactions = storage.getTransactions();

    // Filtrar por período se especificado
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return true;
      });
    }

    const entries = transactions.map(t => this.createJournalEntry(t));

    console.log(`✅ ${entries.length} lançamentos gerados`);

    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async validateAccountingIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const trialBalance = await this.generateTrialBalance();

      if (!trialBalance.isBalanced) {
        errors.push(`Balancete desbalanceado: Débitos (${trialBalance.totalDebits.toFixed(2)}) ≠ Créditos (${trialBalance.totalCredits.toFixed(2)})`);
      }

      const entries = await this.generateJournalEntries();
      const unbalancedEntries = entries.filter(e => !e.isBalanced);

      if (unbalancedEntries.length > 0) {
        errors.push(`${unbalancedEntries.length} lançamentos desbalanceados encontrados`);
      }

      // Verificar contas com saldos negativos inesperados
      const accounts = storage.getAccounts();
      for (const account of accounts) {
        if (account.balance < 0 && this.getAccountType(account.name) === 'asset') {
          warnings.push(`Conta de ativo com saldo negativo: ${account.name} (${account.balance.toFixed(2)})`);
        }
      }

    } catch (error) {
      errors.push(`Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    const isValid = errors.length === 0;

    console.log('✅ Validação concluída:', {
      isValid,
      errorsCount: errors.length,
      warningsCount: warnings.length,
    });

    return { isValid, errors, warnings };
  }
}

export const doubleEntryEngine = new DoubleEntryEngine();

import { storage } from './storage';
import type { Account, Transaction } from './data-layer/types';

interface ReconciliationResult {
  accountId: string;
  accountName: string;
  currentBalance: number;
  calculatedBalance: number;
  difference: number;
  isBalanced: boolean;
  transactionCount: number;
}

interface ReconciliationReport {
  timestamp: string;
  totalAccounts: number;
  balancedAccounts: number;
  unbalancedAccounts: number;
  totalDifference: number;
  results: ReconciliationResult[];
}

interface FixResult {
  fixed: number;
  errors: string[];
}

export async function runReconciliation(): Promise<ReconciliationReport> {
  console.log('🔍 Iniciando reconciliação de contas...');
  
  const accounts = storage.getAccounts();
  const transactions = storage.getTransactions();
  const results: ReconciliationResult[] = [];
  
  let balancedAccounts = 0;
  let totalDifference = 0;

  for (const account of accounts) {
    // Calcular saldo baseado nas transações
    const accountTransactions = transactions.filter(
      (t) => t.account === account.name || t.account === account.id
    );
    
    let calculatedBalance = account.initialBalance || 0;
    
    for (const transaction of accountTransactions) {
      if (transaction.type === 'income') {
        calculatedBalance += Math.abs(transaction.amount);
      } else if (transaction.type === 'expense') {
        calculatedBalance -= Math.abs(transaction.amount);
      }
    }
    
    const difference = Math.abs(account.balance - calculatedBalance);
    const isBalanced = difference < 0.01; // Tolerância de 1 centavo
    
    if (isBalanced) {
      balancedAccounts++;
    } else {
      totalDifference += difference;
    }
    
    results.push({
      accountId: account.id,
      accountName: account.name,
      currentBalance: account.balance,
      calculatedBalance,
      difference,
      isBalanced,
      transactionCount: accountTransactions.length,
    });
  }

  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    totalAccounts: accounts.length,
    balancedAccounts,
    unbalancedAccounts: accounts.length - balancedAccounts,
    totalDifference,
    results,
  };

  console.log('✅ Reconciliação concluída:', {
    totalAccounts: report.totalAccounts,
    balancedAccounts: report.balancedAccounts,
    unbalancedAccounts: report.unbalancedAccounts,
  });

  return report;
}

export async function fixAccountBalances(accountIds: string[]): Promise<FixResult> {
  console.log(`🔧 Corrigindo saldos de ${accountIds.length} contas...`);
  
  const accounts = storage.getAccounts();
  const transactions = storage.getTransactions();
  const errors: string[] = [];
  let fixed = 0;

  for (const accountId of accountIds) {
    try {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) {
        errors.push(`Conta não encontrada: ${accountId}`);
        continue;
      }

      // Recalcular saldo correto
      const accountTransactions = transactions.filter(
        (t) => t.account === account.name || t.account === account.id
      );
      
      let correctBalance = account.initialBalance || 0;
      
      for (const transaction of accountTransactions) {
        if (transaction.type === 'income') {
          correctBalance += Math.abs(transaction.amount);
        } else if (transaction.type === 'expense') {
          correctBalance -= Math.abs(transaction.amount);
        }
      }

      // Atualizar saldo da conta
      storage.updateAccount(accountId, { balance: correctBalance });
      fixed++;
      
      console.log(`✅ Conta ${account.name} corrigida: ${account.balance} → ${correctBalance}`);
      
    } catch (error) {
      const errorMsg = `Erro ao corrigir conta ${accountId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  console.log(`🎉 Correção concluída: ${fixed} contas corrigidas, ${errors.length} erros`);
  
  return { fixed, errors };
}
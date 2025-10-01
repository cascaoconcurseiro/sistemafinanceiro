// Core Finance Engine - Centralized Financial Calculations
// This module contains all financial calculation functions to ensure consistency

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  accountId: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface RelatorioMensal {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
  averageTransaction: number;
  largestIncome: number;
  largestExpense: number;
  categoryBreakdown: Record<string, number>;
}

// Cache para otimizar cálculos
let _cache: Map<string, any> = new Map();

function _updateCache(key: string, value: any) {
  _cache.set(key, value);
}

function _getFromCache(key: string) {
  return _cache.get(key);
}

export function clearCache() {
  _cache.clear();
}

/**
 * Calcula relatório mensal completo baseado nas transações
 */
export function getRelatorioMensal(
  month: string, 
  transactions: Transaction[] = [], 
  accounts: Account[] = []
): RelatorioMensal {
  const cacheKey = `relatorio-${month}-${transactions.length}`;
  const cached = _getFromCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  // Filtrar transações do mês
  const monthTransactions = transactions.filter(t => 
    t.date.startsWith(month)
  );

  // Calcular totais
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netFlow = totalIncome - totalExpenses;

  // Calcular estatísticas
  const transactionCount = monthTransactions.length;
  const averageTransaction = transactionCount > 0 
    ? monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactionCount 
    : 0;

  const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
  const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');

  const largestIncome = incomeTransactions.length > 0 
    ? Math.max(...incomeTransactions.map(t => t.amount)) 
    : 0;

  const largestExpense = expenseTransactions.length > 0 
    ? Math.max(...expenseTransactions.map(t => Math.abs(t.amount))) 
    : 0;

  // Breakdown por categoria
  const categoryBreakdown: Record<string, number> = {};
  monthTransactions.forEach(t => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = 0;
    }
    categoryBreakdown[t.category] += Math.abs(t.amount);
  });

  const relatorio: RelatorioMensal = {
    totalIncome,
    totalExpenses,
    netFlow,
    transactionCount,
    averageTransaction,
    largestIncome,
    largestExpense,
    categoryBreakdown
  };

  _updateCache(cacheKey, relatorio);
  return relatorio;
}

/**
 * Calcula saldo global de todas as contas
 */
export function getSaldoGlobal(accounts: Account[] = []): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

/**
 * Obtém transações por conta específica
 */
export function getTransacoesPorConta(
  accountId: string, 
  transactions: Transaction[] = []
): Transaction[] {
  return transactions.filter(t => t.accountId === accountId);
}

/**
 * Calcula resumo por categorias
 */
export function getResumoCategorias(
  transactions: Transaction[] = []
): Record<string, { total: number; count: number; type: 'income' | 'expense' | 'mixed' }> {
  const resumo: Record<string, { total: number; count: number; type: 'income' | 'expense' | 'mixed' }> = {};

  transactions.forEach(t => {
    if (!resumo[t.category]) {
      resumo[t.category] = { total: 0, count: 0, type: t.type };
    }
    
    resumo[t.category].total += Math.abs(t.amount);
    resumo[t.category].count += 1;
    
    // Verificar se categoria tem tipos mistos
    if (resumo[t.category].type !== t.type) {
      resumo[t.category].type = 'mixed';
    }
  });

  return resumo;
}

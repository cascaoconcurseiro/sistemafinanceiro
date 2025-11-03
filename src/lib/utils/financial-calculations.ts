/**
 * 💰 FINANCIAL CALCULATIONS - Cálculos Financeiros Centralizados
 *
 * Todas as fórmulas de cálculo financeiro em um único lugar
 */

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: Date | string;
  accountId: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

/**
 * Calcula saldo de uma conta baseado em suas transações
 * REGRA: income = positivo, expense = negativo
 * ✅ CORREÇÃO CRÍTICA: Quando uma transação está vinculada a uma conta (accountId),
 * SEMPRE usar o valor TOTAL (amount), NÃO o myShare.
 * Motivo: Se você pagou R$ 100 por outra pessoa, R$ 100 saiu da sua conta,
 * independente de quanto é sua parte (myShare).
 */
export function calculateAccountBalance(
  accountId: string,
  transactions: Transaction[]
): number {
  return transactions
    .filter(t => t.accountId === accountId)
    .reduce((sum, t) => {
      // ✅ CORREÇÃO: SEMPRE usar o valor total quando vinculado a uma conta
      // O myShare é apenas para relatórios de despesas compartilhadas,
      // NÃO para cálculo de saldo de conta
      const amount = Number(t.amount);

      console.log(`💰 [calculateAccountBalance] Transação:`, {
        description: (t as any).description,
        amount: amount,
        type: t.type,
        accountId: t.accountId
      });

      // Income/RECEITA: adiciona o valor
      if (t.type === 'income' || t.type === 'RECEITA') return sum + Math.abs(amount);
      // Expense/DESPESA: subtrai o valor
      if (t.type === 'expense' || t.type === 'DESPESA') return sum - Math.abs(amount);
      // Transfer: mantém o valor como está (pode ser positivo ou negativo)
      return sum + amount;
    }, 0);
}

/**
 * Calcula saldo incluindo valores a receber de despesas compartilhadas
 */
export async function calculateAccountBalanceWithDebts(
  accountId: string,
  transactions: Transaction[]
): Promise<number> {
  const baseBalance = calculateAccountBalance(accountId, transactions);

  try {
    // Buscar valores a receber (débitos de outros para mim)
    const { getDebts } = await import('@/lib/utils/debt-helpers');
    const debts = await getDebts();

    // Somar valores que me devem (créditos)
    const amountToReceive = debts.summary.totalOweMe;

    return baseBalance + amountToReceive;
  } catch (error) {
    console.error('Erro ao calcular débitos:', error);
    return baseBalance; // Retorna saldo base se houver erro
  }
}

/**
 * Calcula saldos de todas as contas
 */
export function calculateAllBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  try {
    // Validar entrada
    if (!Array.isArray(accounts) || !Array.isArray(transactions)) {
      console.error('❌ calculateAllBalances: Entrada inválida');
      return {};
    }

    // Normalizar transações
    const normalizedTransactions = transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      date: t.date instanceof Date ? t.date : new Date(t.date)
    })).filter(t => !isNaN(t.amount) && isFinite(t.amount));

    for (const account of accounts) {
      try {
        balances[account.id] = calculateAccountBalance(account.id, normalizedTransactions);
      } catch (error) {
        console.error(`❌ Erro ao calcular saldo da conta ${account.id}:`, error);
        balances[account.id] = 0;
      }
    }
  } catch (error) {
    console.error('❌ calculateAllBalances: Erro geral:', error);
  }

  return balances;
}

/**
 * Calcula saldo total de todas as contas
 */
export function calculateTotalBalance(balances: Record<string, number>): number {
  return Object.values(balances).reduce((sum, balance) => sum + balance, 0);
}

/**
 * Verifica se uma data está no mês atual
 */
export function isCurrentMonth(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * Calcula receitas do mês atual
 * ✅ CORREÇÃO: SEMPRE usar o valor TOTAL quando vinculado a uma conta
 */
export function calculateMonthlyIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => (t.type === 'income' || t.type === 'RECEITA') && isCurrentMonth(t.date))
    .reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount));
      return sum + amount;
    }, 0);
}

/**
 * Calcula despesas do mês atual
 * ✅ CORREÇÃO: SEMPRE usar o valor TOTAL quando vinculado a uma conta
 */
export function calculateMonthlyExpenses(transactions: Transaction[]): number {
  return transactions
    .filter(t => (t.type === 'expense' || t.type === 'DESPESA') && isCurrentMonth(t.date))
    .reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount));
      return sum + amount;
    }, 0);
}

/**
 * Calcula balanço mensal (receitas - despesas)
 */
export function calculateMonthlyBalance(
  monthlyIncome: number,
  monthlyExpenses: number
): number {
  return monthlyIncome - monthlyExpenses;
}

/**
 * Calcula progresso de uma meta
 */
export function calculateGoalProgress(
  currentAmount: number,
  targetAmount: number
): number {
  if (targetAmount <= 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
}

/**
 * Calcula gastos por categoria do mês atual
 * ✅ CORREÇÃO: SEMPRE usar o valor TOTAL quando vinculado a uma conta
 */
export function calculateExpensesByCategory(transactions: Transaction[]): Record<string, number> {
  const expensesByCategory: Record<string, number> = {};

  transactions
    // ✅ CORREÇÃO: Aceitar ambos os formatos (expense/DESPESA)
    .filter(t => (t.type === 'expense' || t.type === 'DESPESA') && isCurrentMonth(t.date))
    .forEach(t => {
      const category = (t as any).category || 'Outros';
      const amount = Math.abs(Number(t.amount));
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    });

  return expensesByCategory;
}

/**
 * Calcula todas as métricas financeiras
 */
export function calculateFinancialMetrics(
  accounts: Account[],
  transactions: Transaction[]
) {
  const accountBalances = calculateAllBalances(accounts, transactions);
  const totalBalance = calculateTotalBalance(accountBalances);
  const monthlyIncome = calculateMonthlyIncome(transactions);
  const monthlyExpenses = calculateMonthlyExpenses(transactions);
  const monthlyBalance = calculateMonthlyBalance(monthlyIncome, monthlyExpenses);
  const expensesByCategory = calculateExpensesByCategory(transactions);

  return {
    accountBalances,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
    expensesByCategory
  };
}

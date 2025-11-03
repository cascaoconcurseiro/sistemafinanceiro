import { useMemo } from 'react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';

/**
 * Hook otimizado para dados do dashboard
 * Carrega apenas os dados essenciais e faz memoização
 */
export function useDashboardData() {
  const { data, loading, error } = useUnifiedFinancial();
  const { selectedMonth, selectedYear } = usePeriod(); // ✅ CORREÇÃO: Usar período selecionado

  // Memoizar cálculos pesados
  const dashboardMetrics = useMemo(() => {
    if (!data || loading) {
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        accountsCount: 0,
        transactionsCount: 0,
        goalsCount: 0,
      };
    }

    // ✅ CORREÇÃO: Usar período selecionado em vez do mês atual
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;

    // Filtrar transações do mês atual
    const currentMonthTransactions = (data.transactions || []).filter((t: any) => {
      // ✅ NOVO: Excluir transações de dívidas (pago por outra pessoa)
      // Essas transações não afetam o saldo, pois o dinheiro não saiu da sua conta
      if (t.paidBy) {
        return false;
      }
      
      // ✅ NOVO: Também verificar metadata.paidByName (formato antigo)
      try {
        const metadata = t.metadata ? JSON.parse(t.metadata) : null;
        if (metadata && metadata.paidByName) {
          return false;
        }
      } catch (e) {
        // Ignorar erros de parse
      }
      
      const transDate = new Date(t.date);
      return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });

    // ✅ Helper para obter o valor correto da transação
    const getTransactionAmount = (t: any): number => {
      // Para transações compartilhadas, usar myShare
      if ((t.isShared || t.type === 'shared') && 
          t.myShare !== null && 
          t.myShare !== undefined) {
        return Math.abs(Number(t.myShare));
      }
      // Para transações normais, usar amount
      return Math.abs(t.amount);
    };

    // Calcular receitas e despesas do mês
    const monthlyIncome = currentMonthTransactions
      .filter((t: any) => t.type === 'income' || t.type === 'RECEITA')
      .reduce((sum: number, t: any) => sum + getTransactionAmount(t), 0);

    const monthlyExpenses = currentMonthTransactions
      .filter((t: any) => t.type === 'expense' || t.type === 'DESPESA')
      .reduce((sum: number, t: any) => sum + getTransactionAmount(t), 0);

    // Saldo total das contas (EXCLUINDO cartões de crédito)
    const totalBalance = (data.accounts || [])
      .filter((a: any) => {
        // Filtrar apenas contas ativas
        if (!a.isActive) return false;
        
        // ✅ CORREÇÃO: Excluir cartões de crédito do saldo total
        // Cartões são passivos (dívidas) e não devem ser somados como ativos
        const accountType = (a.type || '').toLowerCase();
        const isCreditCard = accountType.includes('credit') || accountType === 'credit_card';
        
        return !isCreditCard;
      })
      .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
      accountsCount: (data.accounts || []).filter((a: any) => a.isActive).length,
      transactionsCount: currentMonthTransactions.length,
      goalsCount: (data.goals || []).filter((g: any) => !g.isCompleted).length,
    };
  }, [data, loading, selectedMonth, selectedYear]); // ✅ CORREÇÃO: Adicionar dependências do período

  return {
    metrics: dashboardMetrics,
    loading,
    error,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { SavingsSuggestionEngine } from '@/core/ml/savings-suggestions';

const suggestionEngine = new SavingsSuggestionEngine();

/**
 * GET /api/ml/savings-suggestions
 * Gera sugestões de economia personalizadas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar transações do mês atual e últimos 3 meses
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: threeMonthsAgo,
        },
        deletedAt: null,
      },
      select: {
        amount: true,
        category: true,
        type: true,
        date: true,
      },
    });

    // Calcular renda mensal
    const incomeTransactions = transactions.filter(t => t.type === 'RECEITA');
    const monthlyIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / 3;

    // Agrupar despesas por categoria
    const expensesByCategory: Record<string, number[]> = {};
    const currentMonthExpenses: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === 'DESPESA') {
        const category = t.category || 'Outros';
        const amount = Math.abs(Number(t.amount));
        const transactionDate = new Date(t.date);

        // Histórico
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = [];
        }
        expensesByCategory[category].push(amount);

        // Mês atual
        if (transactionDate.getMonth() === now.getMonth() && 
            transactionDate.getFullYear() === now.getFullYear()) {
          currentMonthExpenses[category] = (currentMonthExpenses[category] || 0) + amount;
        }
      }
    });

    // Criar análise de gastos
    const spendingAnalysis = Object.entries(expensesByCategory).map(([category, amounts]) => {
      const currentMonthly = currentMonthExpenses[category] || 0;
      const averageMonthly = amounts.reduce((sum, a) => sum + a, 0) / 3;
      const comparedToAverage = averageMonthly > 0 
        ? ((currentMonthly - averageMonthly) / averageMonthly) * 100 
        : 0;

      // Calcular tendência
      const recent = amounts.slice(-30);
      const previous = amounts.slice(-60, -30);
      const recentAvg = recent.reduce((sum, a) => sum + a, 0) / recent.length;
      const previousAvg = previous.length > 0 
        ? previous.reduce((sum, a) => sum + a, 0) / previous.length 
        : recentAvg;

      let trend: 'increasing' | 'decreasing' | 'stable';
      const trendDiff = ((recentAvg - previousAvg) / previousAvg) * 100;
      if (Math.abs(trendDiff) < 5) trend = 'stable';
      else if (trendDiff > 0) trend = 'increasing';
      else trend = 'decreasing';

      return {
        category,
        currentMonthly,
        averageMonthly,
        trend,
        percentageOfIncome: monthlyIncome > 0 ? (currentMonthly / monthlyIncome) * 100 : 0,
        comparedToAverage,
      };
    });

    // Gerar sugestões
    const suggestions = suggestionEngine.generateSuggestions(spendingAnalysis, monthlyIncome);

    return NextResponse.json({
      success: true,
      suggestions,
      summary: {
        totalPotentialSavings: suggestions.reduce((sum, s) => sum + s.potentialSavings, 0),
        highPrioritySuggestions: suggestions.filter(s => s.priority === 'high').length,
        easySuggestions: suggestions.filter(s => s.difficulty === 'easy').length,
      },
    });
  } catch (error) {
    console.error('❌ [API] Erro ao gerar sugestões:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões de economia' },
      { status: 500 }
    );
  }
}

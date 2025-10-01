import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar resumo do dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_month';
    
    // Calcular datas baseadas no período
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'current_month':
        // Primeiro dia do mês atual
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // Último dia do mês atual
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        // Padrão: mês atual em vez dos últimos 30 dias
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Buscar contas ativas com saldo atualizado
    const accounts = await prisma.account.findMany({
      where: { isActive: true }
    });

    // Calcular saldo total atual baseado nas contas
    const totalBalance = accounts.reduce((sum, account) => {
      return sum + Number(account.balance);
    }, 0);

    // Buscar todas as transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        account: true
      },
      orderBy: { date: 'desc' }
    });

    // Calcular métricas
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const amount = Math.abs(Number(transaction.amount)); // Usar valor absoluto
      
      // Mapear tipos corretos: debit = despesa, credit = receita
      if (transaction.type === 'credit' || transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'debit' || transaction.type === 'expense') {
        totalExpenses += amount;
        
        // Agrupar por categoria (apenas despesas)
        const category = transaction.category || 'Outros';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
      }
    });

    const netIncome = totalIncome - totalExpenses;

    // Buscar transações recentes (últimas 10)
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        account: true
      }
    });

    // Buscar metas ativas
    const activeGoals = await prisma.goal.findMany({
      where: {
        isCompleted: false
      },
      orderBy: { targetDate: 'asc' }
    });

    const summary = {
      totalIncome,
      totalExpenses,
      netIncome,
      totalBalance, // Saldo total atual das contas
      totalTransactions: transactions.length, // Total de transações no período
      categoryBreakdown,
      recentTransactions: recentTransactions.map(t => ({
        ...t,
        amount: Number(t.amount),
        status: t.status || 'completed'
      })),
      activeGoals: activeGoals.map(g => ({
        ...g,
        targetAmount: Number(g.target),
        currentAmount: Number(g.current)
      })),
      trendAnalysis: {
        incomeChange: 0, // TODO: Implementar cálculo de tendência
        expenseChange: 0
      },
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };

    console.log('🔍 API /dashboard - Retornando resumo:', {
      totalIncome,
      totalExpenses,
      netIncome,
      totalTransactions: transactions.length,
      transactionsCount: transactions.length
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Erro ao buscar resumo do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Buscar contas ativas
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
    });

    // Buscar transações no período
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
      },
    });

    // Calcular métricas
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const netIncome = totalIncome - totalExpenses;

    // Breakdown por categoria
    const categoryBreakdown: { [key: string]: { amount: number; count: number } } = {};
    transactions.forEach(t => {
      const categoryName = t.category || 'Outros';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = { amount: 0, count: 0 };
      }
      if (t.type === 'debit') {
        categoryBreakdown[categoryName].amount += Number(t.amount);
        categoryBreakdown[categoryName].count += 1;
      }
    });

    // Transações recentes (últimas 10)
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        account: true,
      },
    });

    // Metas ativas (não completadas)
    const activeGoals = await prisma.goal.findMany({
      where: { isCompleted: false },
    });

    // Dados mensais para gráficos
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    transactions.forEach(t => {
      const monthKey = t.date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      if (t.type === 'credit') {
        monthlyData[monthKey].income += Number(t.amount);
      } else if (t.type === 'debit') {
        monthlyData[monthKey].expenses += Number(t.amount);
      }
    });

    const monthlyReports = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        netFlow: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      data: {
        totalBalance,
        totalIncome,
        totalExpenses,
        netIncome,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({
          name,
          amount: data.amount,
          count: data.count,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        })),
        recentTransactions,
        activeGoals,
        monthlyReports,
        accountBalances: accounts.reduce((acc, account) => {
          acc[account.id] = Number(account.balance || 0);
          return acc;
        }, {} as { [key: string]: number }),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar resumo do dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
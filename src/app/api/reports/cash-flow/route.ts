import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '6m';

    // Para o fluxo de caixa, sempre mostrar os últimos 6 meses
    const now = new Date();
    const calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês atual
    const calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Primeiro dia de 6 meses atrás

    // Se datas específicas foram fornecidas, usar elas
    if (startDate && endDate) {
      const customStartDate = new Date(startDate);
      const customEndDate = new Date(endDate);
      
      // Buscar transações no período customizado
      const transactions = await prisma.transaction.findMany({
        where: {
          date: {
            gte: customStartDate,
            lte: customEndDate,
          },
        },
        include: {
          account: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Calcular totais para período customizado
      const totalIncome = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const netFlow = totalIncome - totalExpenses;

      return NextResponse.json({
        success: true,
        data: {
          period: `${customStartDate.toISOString().split('T')[0]} - ${customEndDate.toISOString().split('T')[0]}`,
          totalIncome,
          totalExpenses,
          netFlow,
          monthlyData: [],
        },
      });
    }

    // Buscar transações dos últimos 6 meses
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: calculatedStartDate,
          lte: calculatedEndDate,
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Criar array com os últimos 6 meses
    const monthsArray = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().substring(0, 7); // YYYY-MM
      monthsArray.push({
        month: monthKey,
        income: 0,
        expenses: 0,
        netFlow: 0,
        accumulatedBalance: 0
      });
    }

    // Agrupar transações por mês
    const monthlyData: { [key: string]: { income: number; expenses: number; netFlow: number } } = {};

    transactions.forEach((transaction) => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, netFlow: 0 };
      }

      if (transaction.type === 'credit') {
        monthlyData[monthKey].income += Number(transaction.amount);
      } else if (transaction.type === 'debit') {
        monthlyData[monthKey].expenses += Number(transaction.amount);
      }
      
      monthlyData[monthKey].netFlow = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
    });

    // Preencher dados dos meses e calcular saldo acumulado
    let accumulatedBalance = 0;
    monthsArray.forEach((monthData) => {
      if (monthlyData[monthData.month]) {
        monthData.income = monthlyData[monthData.month].income;
        monthData.expenses = monthlyData[monthData.month].expenses;
        monthData.netFlow = monthlyData[monthData.month].netFlow;
      }
      accumulatedBalance += monthData.netFlow;
      monthData.accumulatedBalance = accumulatedBalance;
    });

    // Converter para array ordenado (formato compatível com o frontend)
    const cashFlowData = monthsArray.map(({ month, income, expenses, netFlow, accumulatedBalance }) => ({
      month,
      income,
      expenses,
      netFlow: accumulatedBalance, // Usar saldo acumulado como netFlow
    }));

    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netFlow = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        period: `${calculatedStartDate.toISOString().split('T')[0]} - ${calculatedEndDate.toISOString().split('T')[0]}`,
        totalIncome,
        totalExpenses,
        netFlow,
        monthlyData: cashFlowData,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar fluxo de caixa:', error);
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
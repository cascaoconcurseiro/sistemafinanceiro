import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Usar helper de autenticação padrão
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '6m';

    // Primeiro, verificar se existem transações do usuário para determinar o período adequado
    const firstTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: 'asc' }
    });
    
    const lastTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    let calculatedStartDate: Date;
    let calculatedEndDate: Date;

    if (firstTransaction && lastTransaction) {
      // Se existem transações, usar o período das transações
      calculatedStartDate = new Date(firstTransaction.date);
      calculatedEndDate = new Date(lastTransaction.date);
      
      // Expandir para incluir o mês completo
      calculatedStartDate = new Date(calculatedStartDate.getFullYear(), calculatedStartDate.getMonth(), 1);
      calculatedEndDate = new Date(calculatedEndDate.getFullYear(), calculatedEndDate.getMonth() + 1, 0);
    } else {
      // Se não há transações, usar os últimos 6 meses
      const now = new Date();
      calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    // Se datas específicas foram fornecidas, usar elas
    if (startDate && endDate) {
      const customStartDate = new Date(startDate);
      const customEndDate = new Date(endDate);
      
      // Buscar transações do usuário no período customizado
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
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
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

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

    // Buscar transações do usuário dos últimos 6 meses
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
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

    // Criar array com os meses do período das transações
    const monthsArray = [];
    const startMonth = new Date(calculatedStartDate);
    const endMonth = new Date(calculatedEndDate);
    
    let currentMonth = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
      const monthKey = currentMonth.toISOString().substring(0, 7); // YYYY-MM
      monthsArray.push({
        month: monthKey,
        income: 0,
        expenses: 0,
        netFlow: 0,
        accumulatedBalance: 0
      });
      
      // Avançar para o próximo mês
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // Agrupar transações por mês
    const monthlyData: { [key: string]: { income: number; expenses: number; netFlow: number } } = {};

    transactions.forEach((transaction) => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, netFlow: 0 };
      }

      if (transaction.type === 'income') {
        monthlyData[monthKey].income += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        monthlyData[monthKey].expenses += Math.abs(Number(transaction.amount));
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
      netFlow: netFlow, // Usar netFlow real do mês, não acumulado
    }));

    // Calcular totais REAIS baseados nas transações encontradas
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const netFlow = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        period: `${calculatedStartDate.toISOString().split('T')[0]} - ${calculatedEndDate.toISOString().split('T')[0]}`,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
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

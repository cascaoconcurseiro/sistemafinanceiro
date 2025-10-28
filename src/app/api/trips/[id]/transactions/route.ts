import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Buscar transações de uma viagem específica com cálculos automáticos

export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const tripId = params.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    if (!tripId) {
      return NextResponse.json(
        { error: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a viagem existe
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    // Construir filtros para as transações
    let whereClause: any = {
      tripId: tripId
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    // Buscar transações da viagem
    const rawTransactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        account: true,
        trip: true
      }
    });

    // Expandir transações compartilhadas para mostrar partes individuais
    const transactions: any[] = [];
    for (const transaction of rawTransactions) {
      // Adicionar a transação original
      transactions.push(transaction);
      
      // Se for compartilhada, adicionar as partes individuais
      if (transaction.isShared && transaction.sharedWith) {
        try {
          const sharedData = JSON.parse(transaction.sharedWith as string);
          
          // Adicionar entrada para cada pessoa que compartilha
          if (Array.isArray(sharedData)) {
            for (const share of sharedData) {
              transactions.push({
                ...transaction,
                id: `${transaction.id}-${share.memberId || share.name}`,
                description: `${transaction.description} (${share.name})`,
                amount: share.amount,
                type: transaction.type,
                isShared: false, // Marcar como não compartilhada para não duplicar
                parentTransactionId: transaction.id,
                _isIndividualShare: true, // Flag para identificar
                _shareMember: share.name
              });
            }
          }
        } catch (error) {
          console.error('Erro ao parsear sharedWith:', error);
        }
      }
    }

    // Calcular estatísticas automáticas
    // Para cálculos, usar apenas transações originais (não as partes individuais)
    const originalTransactions = transactions.filter((t: any) => !t._isIndividualShare);
    const expenses = originalTransactions.filter((t: any) => t.type === 'expense');
    const income = originalTransactions.filter((t: any) => t.type === 'income');
    
    const totalExpenses = expenses.reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);
    const totalIncome = income.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const netSpending = totalExpenses - totalIncome;
    
    const remainingBudget = Number(trip.budget) - totalExpenses;
    const budgetUtilization = Number(trip.budget) > 0 ? (totalExpenses / Number(trip.budget)) * 100 : 0;

    // Agrupar gastos por categoria (usando apenas transações originais)
    const expensesByCategory = expenses.reduce((acc: Record<string, any>, transaction: any) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          total: 0,
          count: 0,
          transactions: []
        };
      }
      acc[category].total += Math.abs(Number(transaction.amount));
      acc[category].count += 1;
      acc[category].transactions.push(transaction);
      return acc;
    }, {} as Record<string, any>);

    // Agrupar gastos por dia (usando apenas transações originais)
    const expensesByDay = expenses.reduce((acc: Record<string, any>, transaction: any) => {
      const day = transaction.date.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          date: day,
          total: 0,
          count: 0,
          transactions: []
        };
      }
      acc[day].total += Math.abs(Number(transaction.amount));
      acc[day].count += 1;
      acc[day].transactions.push(transaction);
      return acc;
    }, {} as Record<string, any>);

    // Calcular média diária
    const tripDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const averageDailySpending = totalExpenses / tripDays;

    // Projeção de gastos (se a viagem ainda estiver em andamento)
    const today = new Date();
    const tripStart = new Date(trip.startDate);
    const tripEnd = new Date(trip.endDate);
    
    let projectedTotal = totalExpenses;
    if (today >= tripStart && today <= tripEnd) {
      const daysElapsed = Math.ceil((today.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((tripEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysElapsed > 0) {
        const currentDailyAverage = totalExpenses / daysElapsed;
        projectedTotal = totalExpenses + (currentDailyAverage * remainingDays);
      }
    }

    const response = {
      trip: {
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: Number(trip.budget),
        currency: trip.currency,
        status: trip.status
      },
      transactions: transactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount)
      })),
      summary: {
        totalTransactions: originalTransactions.length, // Contar apenas originais
        totalExpenses,
        totalIncome,
        netSpending,
        remainingBudget,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        averageDailySpending: Math.round(averageDailySpending * 100) / 100,
        projectedTotal: Math.round(projectedTotal * 100) / 100,
        projectedOverBudget: projectedTotal > Number(trip.budget),
        tripDays,
        expensesCount: expenses.length,
        incomeCount: income.length
      },
      analytics: {
        expensesByCategory: Object.values(expensesByCategory).sort((a: any, b: any) => b.total - a.total),
        expensesByDay: Object.values(expensesByDay).sort((a: any, b: any) => a.date.localeCompare(b.date)),
        topExpenseCategories: Object.values(expensesByCategory)
          .sort((a: any, b: any) => b.total - a.total)
          .slice(0, 5),
        recentTransactions: transactions.slice(0, 10) // Mostrar todas incluindo partes individuais
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Erro ao buscar transações da viagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
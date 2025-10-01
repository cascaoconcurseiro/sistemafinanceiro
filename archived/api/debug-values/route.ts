import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // setembro = 9

    // 1. Resumo das contas
    const accountsRaw = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.name,
        a.type,
        COALESCE(SUM(e.credit), 0) - COALESCE(SUM(e.debit), 0) as balance
      FROM accounts a
      LEFT JOIN entries e ON e.account_id = a.id
      WHERE a.is_active = true
      GROUP BY a.id, a.name, a.type
      ORDER BY balance DESC
      LIMIT 5
    `;

    // 2. Total do patrimônio
    const totalAssets = await prisma.$queryRaw`
      SELECT SUM(credit), SUM(debit) 
      FROM entries e
      LEFT JOIN accounts a ON a.id = e.account_id
      WHERE a.is_active = true
    `;

    // 3. Receitas do mês atual
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        entries: {
          where: {
            credit: {
              gt: 0,
            },
          },
          include: {
            categories: true,
            accounts: true,
          },
        },
      },
    });

    const totalIncome = incomeTransactions.reduce((total, transaction) => {
      return total + transaction.entries.reduce((sum, entry) => sum + entry.credit, 0);
    }, 0);

    // 4. Despesas do mês atual
    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        entries: {
          where: {
            debit: {
              gt: 0,
            },
          },
          include: {
            categories: true,
            accounts: true,
          },
        },
      },
    });

    const totalExpense = expenseTransactions.reduce((total, transaction) => {
      return total + transaction.entries.reduce((sum, entry) => sum + entry.debit, 0);
    }, 0);

    // 5. Cash Flow dos últimos 6 meses
    const cashFlowStartDate = new Date(currentYear, currentMonth - 7, 1);
    const cashFlowEndDate = new Date(currentYear, currentMonth, 0);

    const cashFlowTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: cashFlowStartDate,
          lte: cashFlowEndDate,
        },
      },
      include: {
        entries: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Agrupar por mês
    const monthlyData = {};
    cashFlowTransactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      transaction.entries.forEach(entry => {
        monthlyData[monthKey].income += entry.credit;
        monthlyData[monthKey].expense += entry.debit;
      });
    });

    // 6. Contadores gerais
    const counts = {
      transactions: await prisma.transaction.count(),
      entries: await prisma.entries.count(),
      accounts: await prisma.account.count(),
      categories: await prisma.category.count(),
    };

    return NextResponse.json({
      success: true,
      debug: {
        currentMonth,
        currentYear,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        cashFlowRange: {
          startDate: cashFlowStartDate.toISOString(),
          endDate: cashFlowEndDate.toISOString(),
        },
      },
      data: {
        accounts: accountsRaw,
        totalAssets,
        totalIncome,
        totalExpense,
        netFlow: totalIncome - totalExpense,
        cashFlowMonthly: monthlyData,
        incomeTransactions: incomeTransactions.length,
        expenseTransactions: expenseTransactions.length,
        counts,
      },
    });

  } catch (error) {
    console.error('Erro no debug:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
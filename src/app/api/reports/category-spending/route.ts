import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key';

// Cores para categorias
const categoryColors = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#84CC16', '#6366F1', '#F97316', '#14B8A6',
  '#8B5A2B', '#7C3AED', '#059669', '#DC2626', '#9333EA'
];


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const accessToken = request.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Token de acesso requerido' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
      userId = decoded.userId;
      if (!userId) {
        throw new Error('UserId não encontrado no token');
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30d';

    // Calcular datas baseado no período se não fornecidas
    let calculatedStartDate: Date;
    let calculatedEndDate: Date = new Date();

    if (startDate && endDate) {
      calculatedStartDate = new Date(startDate);
      calculatedEndDate = new Date(endDate);
    } else {
      // Calcular baseado no período
      const now = new Date();
      switch (period) {
        case '7d':
          calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          calculatedStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          calculatedStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'current_month':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Buscar transações de despesa do usuário no período
    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: {
          gte: calculatedStartDate,
          lte: calculatedEndDate,
        },
      },
      include: {
        account: true,
        categoryRef: true,
      },
    });

    // Agrupar por categoria
    const categorySpending: { [key: string]: { name: string; amount: number; count: number } } = {};

    expenseTransactions.forEach((transaction) => {
      const categoryName = transaction.categoryRef?.name || 'Sem Categoria';
      
      if (!categorySpending[categoryName]) {
        categorySpending[categoryName] = {
          name: categoryName,
          amount: 0,
          count: 0,
        };
      }

      categorySpending[categoryName].amount += Number(transaction.amount);
      categorySpending[categoryName].count += 1;
    });

    // Calcular total de gastos
    const totalExpenses = Object.values(categorySpending).reduce(
      (sum, category) => sum + category.amount,
      0
    );

    // Converter para array com percentuais e cores
    const categoriesArray = Object.values(categorySpending)
      .map((category, index) => ({
        name: category.name,
        amount: category.amount,
        count: category.count,
        percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
        color: categoryColors[index % categoryColors.length],
      }))
      .sort((a, b) => b.amount - a.amount); // Ordenar por valor decrescente

    // Buscar também receitas do usuário para comparação
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'income',
        date: {
          gte: calculatedStartDate,
          lte: calculatedEndDate,
        },
      },
    });

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netFlow = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        period: `${calculatedStartDate.toISOString().split('T')[0]} - ${calculatedEndDate.toISOString().split('T')[0]}`,
        totalExpenses,
        totalIncome,
        netFlow,
        categories: categoriesArray,
        summary: {
          totalCategories: categoriesArray.length,
          averagePerCategory: categoriesArray.length > 0 ? totalExpenses / categoriesArray.length : 0,
          topCategory: categoriesArray[0] || null,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar gastos por categoria:', error);
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

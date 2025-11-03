import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para validação de budget
const BudgetSchema = z.object({
  accountId: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  amount: z.number().positive('Valor deve ser positivo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  period: z.enum(['monthly', 'weekly', 'yearly']).default('monthly'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  isActive: z.boolean().default(true)
});

// GET /api/budgets - Buscar todos os orçamentos

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const active = searchParams.get('active');

    // ✅ CORREÇÃO CRÍTICA: Filtrar por userId
    const budgets = await prisma.budget.findMany({
      where: {
        userId: auth.userId, // ✅ Isolamento de dados
        ...(active === 'true' && { isActive: true }),
        ...(period && { period })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Para cada orçamento, calcular gastos usando transactions
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        // Calcular período baseado no budget
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        if (budget.startDate && budget.endDate) {
          startDate = budget.startDate;
          endDate = budget.endDate;
        } else {
          // Calcular período automaticamente
          switch (budget.period) {
            case 'monthly':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              break;
            case 'weekly':
              const dayOfWeek = now.getDay();
              startDate = new Date(now);
              startDate.setDate(now.getDate() - dayOfWeek);
              endDate = new Date(startDate);
              endDate.setDate(startDate.getDate() + 6);
              break;
            case 'yearly':
              startDate = new Date(now.getFullYear(), 0, 1);
              endDate = new Date(now.getFullYear(), 11, 31);
              break;
            default:
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          }
        }

        // Buscar transactions relacionadas ao budget no período
        const transactions = await prisma.transaction.findMany({
          where: {
            budgetId: budget.id,
            date: {
              gte: startDate,
              lte: endDate
            },
            type: 'expense', // Apenas despesas contam para o orçamento
            deletedAt: null // Excluir transações deletadas
          }
        });

        // Calcular total gasto (valores já são negativos para despesas)
        const totalSpent = transactions.reduce((sum, transaction) =>
          sum + Math.abs(Number(transaction.amount)), 0
        );

        // Calcular porcentagem gasta
        const percentage = Number(budget.amount) > 0 ? (totalSpent / Number(budget.amount)) * 100 : 0;

        // Determinar status
        let status: 'good' | 'warning' | 'exceeded' = 'good';
        if (percentage > 100) {
          status = 'exceeded';
        } else if (percentage >= Number(budget.alertThreshold)) {
          status = 'warning';
        }

        return {
          ...budget,
          spent: totalSpent,
          remaining: Math.max(0, Number(budget.amount) - totalSpent),
          percentage: Math.round(percentage * 100) / 100,
          status,
          transactionCount: transactions.length,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: budgetsWithSpending
    });

  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Criar novo orçamento
export async function POST(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BudgetSchema.parse(body);

    // ✅ CORREÇÃO CRÍTICA: Verificar se já existe orçamento ativo para a mesma categoria no período (filtrado por usuário)
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: auth.userId, // ✅ Isolamento de dados
        category: validatedData.category,
        period: validatedData.period,
        isActive: true
      }
    });

    if (existingBudget) {
      return NextResponse.json(
        {
          success: false,
          error: 'Já existe um orçamento ativo para esta categoria no período'
        },
        { status: 409 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Criar orçamento com userId
    const budget = await prisma.budget.create({
      data: {
        userId: auth.userId, // ✅ Associar ao usuário autenticado
        accountId: validatedData.accountId,
        name: validatedData.name,
        amount: validatedData.amount,
        category: validatedData.category,
        period: validatedData.period,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        isActive: validatedData.isActive
      }
    });

    return NextResponse.json({
      success: true,
      data: budget
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// PUT /api/budgets - Atualizar orçamento
export async function PUT(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do orçamento é obrigatório'
        },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se orçamento existe e pertence ao usuário
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    if (!existingBudget) {
      return NextResponse.json(
        {
          success: false,
          error: 'Orçamento não encontrado'
        },
        { status: 404 }
      );
    }

    // Atualizar orçamento
    const updatedBudget = await prisma.budget.update({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedBudget
    });

  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets - Deletar orçamento
export async function DELETE(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do orçamento é obrigatório'
        },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se orçamento existe e pertence ao usuário
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    if (!existingBudget) {
      return NextResponse.json(
        {
          success: false,
          error: 'Orçamento não encontrado'
        },
        { status: 404 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se há transactions vinculadas (filtrado por usuário)
    const linkedTransactions = await prisma.transaction.count({
      where: {
        budgetId: id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    if (linkedTransactions > 0) {
      // Soft delete - apenas desativar
      await prisma.budget.update({
        where: {
          id,
          userId: auth.userId // ✅ Isolamento de dados
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Orçamento desativado (há transações vinculadas)'
      });
    } else {
      // Hard delete - remover completamente
      await prisma.budget.delete({
        where: {
          id,
          userId: auth.userId // ✅ Isolamento de dados
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Orçamento removido com sucesso'
      });
    }

  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

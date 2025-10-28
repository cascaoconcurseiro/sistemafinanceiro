import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { SharedExpenseSchema, validateOrThrow } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

/**
 * GET /api/shared-expenses
 * Lista todas as despesas compartilhadas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const { prisma } = await import('@/lib/prisma');
    
    const where: any = { userId: auth.userId };
    if (status) where.status = status;

    const expenses = await prisma.sharedExpense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            date: true,
            accountId: true,
            creditCardId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      expenses: expenses.map(e => ({
        ...e,
        totalAmount: Number(e.totalAmount),
        myShare: Number(e.myShare),
        splits: e.splits ? JSON.parse(e.splits) : [],
      })),
    });
  } catch (error) {
    console.error('❌ [API Shared Expenses GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar despesas compartilhadas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shared-expenses
 * Cria uma despesa compartilhada com atomicidade garantida
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🤝 [API Shared Expenses POST] Criando despesa compartilhada:', body);

    // ✅ VALIDAÇÃO COM ZOD
    try {
      validateOrThrow(SharedExpenseSchema, body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // ✅ PREPARAR DADOS
    const expenseData = {
      ...body,
      userId: auth.userId,
      totalAmount: Math.abs(Number(body.totalAmount)),
      myShare: Math.abs(Number(body.myShare)),
    };

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const expense = await service.createSharedExpense(
      expenseData,
      auth.userId
    );

    console.log('✅ [API Shared Expenses POST] Despesa compartilhada criada:', expense.id);

    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../events/route');
    broadcastEvent('SHARED_EXPENSE_CREATED', {
      id: expense.id,
      totalAmount: Number(expense.totalAmount),
      myShare: Number(expense.myShare),
    });

    return NextResponse.json({
      success: true,
      message: 'Despesa compartilhada criada com sucesso',
      expense: {
        ...expense,
        totalAmount: Number(expense.totalAmount),
        myShare: Number(expense.myShare),
        splits: expense.splits ? JSON.parse(expense.splits) : [],
      },
    });
  } catch (error) {
    console.error('❌ [API Shared Expenses POST] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('soma dos splits')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao criar despesa compartilhada' },
      { status: 500 }
    );
  }
}

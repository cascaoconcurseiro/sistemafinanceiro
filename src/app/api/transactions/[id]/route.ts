import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { TransactionSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';
export const dynamic = 'force-dynamic';

/**
 * GET /api/transactions/[id]
 * Busca uma transação específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: auth.userId,
        deletedAt: null,
      },
      include: {
        account: { select: { id: true, name: true, type: true } },
        categoryRef: { select: { id: true, name: true, type: true } },
        creditCard: { select: { id: true, name: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...transaction,
      amount: Number(transaction.amount),
      myShare: transaction.myShare ? Number(transaction.myShare) : null,
      totalSharedAmount: transaction.totalSharedAmount ? Number(transaction.totalSharedAmount) : null,
      sharedWith: transaction.sharedWith ? JSON.parse(transaction.sharedWith) : null,
      metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
    });
  } catch (error) {
    console.error('❌ [API Transaction GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transação' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]
 * Atualiza uma transação existente com validação de integridade
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // ✅ VALIDAÇÃO PARCIAL COM ZOD
    try {
      TransactionSchema.partial().parse(body);
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
    const updates: any = { ...body };
    if (body.date) updates.date = new Date(body.date);
    if (body.amount) updates.amount = Math.abs(Number(body.amount));

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const transaction = await service.updateTransaction(
      params.id,
      updates,
      auth.userId
    );

    
    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../../events/route');
    broadcastEvent('TRANSACTION_UPDATED', {
      id: transaction.id,
      accountId: transaction.accountId,
      amount: Number(transaction.amount),
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
        myShare: transaction.myShare ? Number(transaction.myShare) : null,
        totalSharedAmount: transaction.totalSharedAmount ? Number(transaction.totalSharedAmount) : null,
      },
    });
  } catch (error) {
    console.error('❌ [API Transaction PUT] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('não pode ser editada')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar transação' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Deleta uma transação com soft delete e reversão em cascata
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('🗑️ [API Transaction DELETE] Deletando:', params.id);

    // ✅ USAR SERVIÇO FINANCEIRO (métodos estáticos)
    await FinancialOperationsService.deleteTransaction(params.id, auth.userId);

    
    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../../events/route');
    broadcastEvent('TRANSACTION_DELETED', {
      id: params.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Transação deletada com sucesso',
    });
  } catch (error) {
    console.error('❌ [API Transaction DELETE] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('não pode ser deletada')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao deletar transação' },
      { status: 500 }
    );
  }
}

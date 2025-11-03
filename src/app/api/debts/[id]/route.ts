import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/debts/[id]
 * Atualizar dívida (marcar como paga, etc)
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

    const userId = auth.userId;
    const body = await request.json();
    const debtId = params.id;

    console.log('🔄 [Debts API PUT] Atualizando dívida:', debtId, body);

    // Buscar dívida
    const debt = await prisma.sharedDebt.findFirst({
      where: {
        id: debtId,
        OR: [
          { debtorId: userId },
          { creditorId: userId },
        ],
      },
    });

    if (!debt) {
      return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });
    }

    // ✅ CORREÇÃO CRÍTICA: Não zerar currentAmount ao marcar como paga
    // Manter o valor original para que apareça na fatura
    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.paidAt) {
      updateData.paidAt = new Date(body.paidAt);
    }

    // ✅ IMPORTANTE: NÃO atualizar currentAmount para 0
    // O valor deve permanecer o mesmo para aparecer na fatura como "PAGO"

    console.log('📝 [Debts API PUT] Dados de atualização:', updateData);

    // Atualizar dívida
    const updatedDebt = await prisma.sharedDebt.update({
      where: { id: debtId },
      data: updateData,
    });

    console.log('✅ [Debts API PUT] Dívida atualizada:', {
      id: updatedDebt.id,
      status: updatedDebt.status,
      currentAmount: updatedDebt.currentAmount,
      paidAt: updatedDebt.paidAt,
    });

    return NextResponse.json({
      success: true,
      debt: {
        id: updatedDebt.id,
        creditorId: updatedDebt.creditorId,
        debtorId: updatedDebt.debtorId,
        originalAmount: Number(updatedDebt.originalAmount),
        currentAmount: Number(updatedDebt.currentAmount),
        paidAmount: Number(updatedDebt.paidAmount),
        description: updatedDebt.description,
        status: updatedDebt.status,
        paidAt: updatedDebt.paidAt,
        createdAt: updatedDebt.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ [Debts API PUT] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


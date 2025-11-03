import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/transactions/[id]/status
 * Atualiza apenas o status da transação (pago/pendente)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'cleared', 'reconciled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: pending, cleared ou reconciled' },
        { status: 400 }
      );
    }

    console.log('🔄 [API Status] Atualizando status:', {
      transactionId: params.id,
      newStatus: status
    });

    // Usar serviço para garantir integridade
    const transaction = await FinancialOperationsService.updateTransactionStatus(
      params.id,
      auth.userId,
      status
    );

    // Emitir evento
    const { broadcastEvent } = await import('../../../events/route');
    broadcastEvent('TRANSACTION_UPDATED', {
      id: transaction.id,
      accountId: transaction.accountId,
      status: transaction.status,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
      },
    });
  } catch (error) {
    console.error('❌ [API Status] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}

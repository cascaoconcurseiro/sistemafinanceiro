import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * POST /api/shared-debts/[id]/pay
 * Paga uma dívida compartilhada com atomicidade garantida
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('💰 [API Shared Debt Pay] Pagando dívida:', params.id);

    // Validar dados
    if (!body.accountId) {
      return NextResponse.json(
        { error: 'accountId é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const payment = await service.paySharedDebt(
      params.id,
      body.accountId,
      auth.userId
    );

    console.log('✅ [API Shared Debt Pay] Dívida paga:', payment.id);

    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../../../events/route');
    broadcastEvent('SHARED_DEBT_PAID', {
      debtId: params.id,
      transactionId: payment.id,
      amount: Number(payment.amount),
    });

    return NextResponse.json({
      success: true,
      message: 'Dívida paga com sucesso',
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
    });
  } catch (error) {
    console.error('❌ [API Shared Debt Pay] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('já foi paga')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('não pertence')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao pagar dívida' },
      { status: 500 }
    );
  }
}

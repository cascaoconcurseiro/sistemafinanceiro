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
    
    // Validar dados
    if (!body.accountId) {
      return NextResponse.json(
        { error: 'accountId é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.amount) {
      return NextResponse.json(
        { error: 'amount é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const result = await service.paySharedDebt(
      params.id,
      auth.userId,
      body.accountId,
      Number(body.amount),
      body.date ? new Date(body.date) : undefined
    );

    
    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../../../events/route');
    broadcastEvent('SHARED_DEBT_PAID', {
      debtId: params.id,
      transactionId: result.paymentTransaction.id,
      amount: Number(result.paymentTransaction.amount),
    });

    return NextResponse.json({
      success: true,
      message: 'Dívida paga com sucesso',
      payment: {
        ...result.paymentTransaction,
        amount: Number(result.paymentTransaction.amount),
      },
      debt: {
        ...result.debt,
        paidAmount: Number(result.debt.paidAmount),
        currentAmount: Number(result.debt.currentAmount),
        originalAmount: Number(result.debt.originalAmount),
      },
    });
  } catch (error) {
    console.error('❌ [API Shared Debt Pay] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('já foi paga') || error.message.includes('já está paga')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('não pertence') || error.message.includes('não tem permissão')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('Valor maior')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao pagar dívida' },
      { status: 500 }
    );
  }
}

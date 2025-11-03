import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * POST /api/installments/[id]/pay
 * Paga uma parcela específica com atomicidade garantida
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

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const payment = await service.payInstallment(
      params.id,
      body.accountId,
      auth.userId
    );

    
    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../../../events/route');
    broadcastEvent('INSTALLMENT_PAID', {
      installmentId: params.id,
      transactionId: payment.id,
      amount: Number(payment.amount),
    });

    return NextResponse.json({
      success: true,
      message: 'Parcela paga com sucesso',
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
    });
  } catch (error) {
    console.error('❌ [API Installment Pay] Erro:', error);

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
    }

    return NextResponse.json(
      { error: 'Erro ao pagar parcela' },
      { status: 500 }
    );
  }
}

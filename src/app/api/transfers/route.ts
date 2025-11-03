import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';
export const dynamic = 'force-dynamic';

// Schema de validação para transferência
const TransferSchema = z.object({
  fromAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
  toAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  date: z.string().optional(),
}).refine(
  (data) => data.fromAccountId !== data.toAccountId,
  {
    message: 'Conta de origem e destino devem ser diferentes',
    path: ['toAccountId'],
  }
);

/**
 * POST /api/transfers
 * Cria uma transferência entre contas com atomicidade garantida
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('💸 [API Transfers POST] Criando transferência:', body);

    // ✅ VALIDAÇÃO COM ZOD
    try {
      TransferSchema.parse(body);
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

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const transfer = await service.createTransfer(
      body.fromAccountId,
      body.toAccountId,
      Math.abs(Number(body.amount)),
      body.description,
      auth.userId,
      body.date ? new Date(body.date) : undefined
    );

    
    // ✅ EMITIR EVENTOS
    const { broadcastEvent } = await import('../events/route');
    broadcastEvent('TRANSFER_CREATED', {
      fromAccountId: transfer.from.accountId,
      toAccountId: transfer.to.accountId,
      amount: Number(transfer.from.amount),
    });

    return NextResponse.json({
      success: true,
      message: 'Transferência criada com sucesso',
      transfer: {
        from: {
          ...transfer.from,
          amount: Number(transfer.from.amount),
        },
        to: {
          ...transfer.to,
          amount: Number(transfer.to.amount),
        },
      },
    });
  } catch (error) {
    console.error('❌ [API Transfers POST] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('mesma conta')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao criar transferência' },
      { status: 500 }
    );
  }
}

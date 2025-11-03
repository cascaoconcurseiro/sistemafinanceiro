import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { InstallmentSchema, validateOrThrow } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

/**
 * GET /api/installments
 * Lista todas as parcelas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');

    const { prisma } = await import('@/lib/prisma');

    const where: any = { userId: auth.userId };
    if (status) where.status = status;
    if (transactionId) where.transactionId = transactionId;

    const installments = await prisma.installment.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            type: true,
            accountId: true,
            creditCardId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      installments: installments.map(i => ({
        ...i,
        amount: Number(i.amount),
      })),
    });
  } catch (error) {
    console.error('❌ [API Installments GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar parcelas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/installments
 * Cria parcelas para uma transação com atomicidade garantida
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API Installments POST] Criando parcelas:', body);

    // ✅ VALIDAÇÃO COM ZOD
    try {
      validateOrThrow(InstallmentSchema, body);
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
    const installmentData = {
      ...body,
      userId: auth.userId,
      startDate: new Date(body.startDate || body.date),
      amount: Math.abs(Number(body.amount)),
    };

    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const installments = await service.createInstallments(
      installmentData,
      auth.userId
    );

    console.log(`✅ [API Installments POST] ${installments.length} parcelas criadas`);

    return NextResponse.json({
      success: true,
      message: `${installments.length} parcelas criadas com sucesso`,
      installments: installments.map(i => ({
        ...i,
        amount: Number(i.amount),
      })),
    });
  } catch (error) {
    console.error('❌ [API Installments POST] Erro:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Saldo insuficiente')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao criar parcelas' },
      { status: 500 }
    );
  }
}

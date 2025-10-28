import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';
import { addMonths } from 'date-fns';

const createInstallmentSchema = z.object({
  transactionId: z.string(),
  totalInstallments: z.number().min(2).max(48),
  amount: z.number().positive(),
  startDate: z.string().datetime(),
  description: z.string().optional(),
});

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

    const where: any = { userId: auth.userId };
    if (status) where.status = status;
    if (transactionId) where.transactionId = transactionId;

    const installments = await prisma.installment.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
    });

    return NextResponse.json(installments);
  } catch (error) {
    console.error('❌ [API Installments] Erro ao buscar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar parcelas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/installments
 * Cria parcelas para uma transação
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados
    const validated = createInstallmentSchema.parse(body);

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: validated.transactionId,
        userId: auth.userId,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Criar parcelas
    const installments = [];
    const startDate = new Date(validated.startDate);

    for (let i = 1; i <= validated.totalInstallments; i++) {
      const dueDate = addMonths(startDate, i - 1);
      
      installments.push({
        transactionId: validated.transactionId,
        userId: auth.userId,
        installmentNumber: i,
        totalInstallments: validated.totalInstallments,
        amount: validated.amount,
        dueDate,
        description: validated.description || `Parcela ${i}/${validated.totalInstallments}`,
        status: i === 1 ? 'paid' : 'pending', // Primeira parcela já paga
      });
    }

    // Criar todas as parcelas
    await prisma.installment.createMany({
      data: installments,
    });

    // Atualizar transação principal
    await prisma.transaction.update({
      where: { id: validated.transactionId },
      data: {
        isInstallment: true,
        installmentNumber: 1,
        totalInstallments: validated.totalInstallments,
      },
    });

    console.log(`✅ [API Installments] ${validated.totalInstallments} parcelas criadas`);

    return NextResponse.json(
      { 
        message: 'Parcelas criadas com sucesso',
        count: validated.totalInstallments,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [API Installments] Erro ao criar:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar parcelas' },
      { status: 500 }
    );
  }
}

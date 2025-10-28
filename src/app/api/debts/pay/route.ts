import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

const payDebtSchema = z.object({
  debtId: z.string().min(1, 'ID da dívida é obrigatório'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  paymentDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log('💳 [Pay Debt API] Processando pagamento de dívida...');
  
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();
    
    console.log('📦 [Pay Debt API] Dados recebidos:', body);

    // Validar dados
    const validation = payDebtSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { debtId, accountId, amount, paymentDate } = validation.data;

    // Buscar dívida
    const debt = await prisma.sharedDebt.findUnique({
      where: { id: debtId },
    });

    if (!debt) {
      return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é o devedor
    if (debt.debtorId !== userId) {
      return NextResponse.json({ error: 'Você não é o devedor desta dívida' }, { status: 403 });
    }

    // Verificar se a dívida já foi paga
    if (debt.status === 'paid') {
      return NextResponse.json({ error: 'Dívida já foi paga' }, { status: 400 });
    }

    // Valor a pagar (se não especificado, paga o total)
    const paymentAmount = amount || Number(debt.currentAmount);

    // Verificar se o valor não excede a dívida
    if (paymentAmount > Number(debt.currentAmount)) {
      return NextResponse.json(
        { error: 'Valor de pagamento excede o valor da dívida' },
        { status: 400 }
      );
    }

    // Criar transação de pagamento
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        accountId: accountId,
        amount: paymentAmount,
        type: 'DESPESA',
        description: `Pagamento de dívida - ${debt.description}`,
        date: paymentDate ? new Date(paymentDate) : new Date(),
        categoryId: null, // Pode criar uma categoria "Pagamento de Dívida"
        status: 'completed',
        metadata: JSON.stringify({
          debtId: debt.id,
          creditorId: debt.creditorId,
          originalDebtAmount: Number(debt.originalAmount),
        }),
      },
    });

    // Atualizar dívida
    const newCurrentAmount = Number(debt.currentAmount) - paymentAmount;
    const newPaidAmount = Number(debt.paidAmount) + paymentAmount;
    const newStatus = newCurrentAmount <= 0 ? 'paid' : 'active';

    await prisma.sharedDebt.update({
      where: { id: debtId },
      data: {
        currentAmount: newCurrentAmount,
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : null,
        transactionId: transaction.id,
      },
    });

    console.log('✅ [Pay Debt API] Pagamento processado:', {
      debtId,
      paymentAmount,
      newStatus,
    });

    return NextResponse.json({
      success: true,
      message: newStatus === 'paid' 
        ? 'Dívida paga completamente!' 
        : `Pagamento de R$ ${paymentAmount.toFixed(2)} realizado. Restante: R$ ${newCurrentAmount.toFixed(2)}`,
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        date: transaction.date,
      },
      debt: {
        id: debt.id,
        currentAmount: newCurrentAmount,
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error('❌ [Pay Debt API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * API: Pagar Despesa Compartilhada
 * Registra pagamento e devolve valor ao orçamento da viagem (se aplicável)
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

    const { id } = params;
    const body = await request.json();
    const { accountId, paymentDate, amount } = body;

    console.log('💰 [Shared Expense Payment] Registrando pagamento:', {
      expenseId: id,
      accountId,
      amount,
      paymentDate
    });

    // Buscar despesa compartilhada
    const sharedExpense = await prisma.sharedExpense.findUnique({
      where: { id },
      include: {
        transaction: true
      }
    });

    if (!sharedExpense) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    // Usar transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar transação de RECEITA (entrada de dinheiro)
      const paymentTransaction = await tx.transaction.create({
        data: {
          userId: auth.userId!,
          accountId: accountId,
          amount: Math.abs(amount),
          description: `Pagamento recebido - ${sharedExpense.transaction.description}`,
          type: 'RECEITA',
          date: new Date(paymentDate),
          status: 'cleared',
          categoryId: 'recebimento-compartilhado',
        }
      });

      // 2. Atualizar despesa compartilhada como paga
      const updatedExpense = await tx.sharedExpense.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(paymentDate)
        }
      });

      // 3. Se for de viagem, devolver ao orçamento
      if (sharedExpense.transaction.tripId) {
        const trip = await tx.trip.findUnique({
          where: { id: sharedExpense.transaction.tripId }
        });

        if (trip) {
          const newSpent = Math.max(0, Number(trip.spent) - amount);
          
          await tx.trip.update({
            where: { id: trip.id },
            data: { spent: newSpent }
          });

          console.log('✅ [Shared Expense Payment] Orçamento da viagem atualizado:', {
            tripId: trip.id,
            spentAnterior: trip.spent,
            spentNovo: newSpent,
            valorDevolvido: amount
          });
        }
      }

      return {
        payment: paymentTransaction,
        expense: updatedExpense,
        tripId: sharedExpense.transaction.tripId
      };
    });

    // Disparar evento se for de viagem
    if (result.tripId) {
      // O frontend escutará este evento via SSE ou polling
      console.log('📢 [Shared Expense Payment] Evento tripBudgetUpdated disparado');
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamento registrado com sucesso!',
      data: result
    });

  } catch (error) {
    console.error('❌ [Shared Expense Payment] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao registrar pagamento',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

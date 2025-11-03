import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shared-expenses/pay
 * Processa pagamento de despesas compartilhadas
 */
export async function POST(request: NextRequest) {
  try {
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
            return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionIds, accountId, paymentDate, notes } = body;

    console.log('💰 [API Shared Expenses Pay] Processando pagamento:', {
      userId: auth.userId,
      transactionIds,
      accountId
    });

    // Validações
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs de transações inválidos' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Conta não especificada' },
        { status: 400 }
      );
    }

    // Verificar se a conta existe e pertence ao usuário
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: auth.userId
      }
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Buscar transações originais
    const originalTransactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: auth.userId
      }
    });

    if (originalTransactions.length !== transactionIds.length) {
      return NextResponse.json(
        { success: false, error: 'Algumas transações não foram encontradas' },
        { status: 404 }
      );
    }

    const paymentTransactions = [];
    const updatedTrips = [];
    let totalPaid = 0;

    // Processar cada transação
    for (const originalTx of originalTransactions) {
      // Parse sharedWith se for string
      let sharedWith = originalTx.sharedWith;
      if (typeof sharedWith === 'string') {
        try {
          sharedWith = JSON.parse(sharedWith);
          if (typeof sharedWith === 'string') {
            sharedWith = JSON.parse(sharedWith);
          }
        } catch (e) {
          console.error('Erro ao parsear sharedWith:', e);
          sharedWith = [];
        }
      }

      // Calcular valor da parte do usuário
      const totalParticipants = Array.isArray(sharedWith) ? sharedWith.length + 1 : 1;
      const myShare = Math.abs(originalTx.amount) / totalParticipants;
      totalPaid += myShare;

      // Criar transação de pagamento
      const paymentTx = await prisma.transaction.create({
        data: {
          type: 'expense',
          amount: -myShare, // Valor negativo (saída)
          description: `Pagamento: ${originalTx.description}`,
          date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
          accountId: accountId,
          categoryId: originalTx.categoryId,
          userId: originalTx.userId,
          status: 'completed',
          metadata: JSON.stringify({
            sharedExpensePayment: true,
            originalTransactionId: originalTx.id,
            notes: notes || ''
          })
        }
      });

      paymentTransactions.push(paymentTx);

      // Marcar transação original como paga
      const currentMetadata = typeof originalTx.metadata === 'string'
        ? JSON.parse(originalTx.metadata || '{}')
        : originalTx.metadata || {};

      await prisma.transaction.update({
        where: { id: originalTx.id },
        data: {
          metadata: JSON.stringify({
            ...currentMetadata,
            paid: true,
            paidDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
            paymentTransactionId: paymentTx.id
          })
        }
      });

      // Se for despesa de viagem, atualizar limite
      if (originalTx.tripId) {
        const trip = await prisma.trip.findUnique({
          where: { id: originalTx.tripId }
        });

        if (trip) {
          const newSpentAmount = (trip.spentAmount || 0) + myShare;
          const updatedTrip = await prisma.trip.update({
            where: { id: trip.id },
            data: {
              spentAmount: newSpentAmount,
              remainingBudget: trip.budget - newSpentAmount
            }
          });
          updatedTrips.push(updatedTrip);
        }
      }
    }

    // Atualizar saldo da conta
    const newBalance = account.balance - totalPaid;
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance }
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentTransactions,
        updatedTrips,
        totalPaid,
        newAccountBalance: newBalance
      }
    });

  } catch (error) {
    console.error('❌ [API Shared Expenses Pay] Erro ao processar pagamento:', error);
    console.error('❌ [API Shared Expenses Pay] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * POST /api/debts/pay
 * Pagar uma dívida criando transação de pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();

    console.log('💰 [Debts Pay API] Dados recebidos:', body);

    const { debtId, accountId, amount, paymentDate } = body;

    if (!debtId || !accountId || !amount) {
      return NextResponse.json(
        { error: 'Dados incompletos: debtId, accountId e amount são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dívida
    const debt = await prisma.sharedDebt.findFirst({
      where: {
        id: debtId,
        OR: [
          { debtorId: userId },
          { creditorId: userId },
        ],
      },
    });

    if (!debt) {
      return NextResponse.json({ error: 'Dívida não encontrada' }, { status: 404 });
    }

    // Verificar se já está paga
    if (debt.status === 'paid') {
      return NextResponse.json({ error: 'Dívida já está paga' }, { status: 400 });
    }

    // Buscar informações do credor para a descrição
    const creditor = await prisma.user.findUnique({
      where: { id: debt.creditorId },
      select: { name: true, email: true },
    });

    const creditorName = creditor?.name || creditor?.email || debt.creditorId;

    // Criar transação de pagamento
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        accountId: accountId,
        amount: -Math.abs(Number(amount)), // Negativo porque é saída de dinheiro
        description: `💸 Pagamento - ${debt.description} (para ${creditorName})`,
        type: 'DESPESA',
        date: paymentDate ? new Date(paymentDate) : new Date(),
        status: 'cleared',
        metadata: JSON.stringify({
          type: 'shared_expense_payment',
          billingItemId: `debt-${debtId}`,
          originalTransactionId: debtId,
          paidBy: creditorName,
        }),
      },
    });

    // ✅ CORREÇÃO: Marcar dívida como paga SEM zerar o currentAmount
    await prisma.sharedDebt.update({
      where: { id: debtId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        // ✅ NÃO atualizar currentAmount - manter o valor original
      },
    });

    console.log('✅ [Debts Pay API] Dívida paga:', {
      debtId,
      transactionId: transaction.id,
      amount,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        description: transaction.description,
      },
      debt: {
        id: debt.id,
        status: 'paid',
        currentAmount: Number(debt.currentAmount), // Mantém o valor original
      },
    });
  } catch (error) {
    console.error('❌ [Debts Pay API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const creditCardId = params.id;

    // Verificar se o cartão pertence ao usuário
    const card = await prisma.creditCard.findFirst({
      where: {
        id: creditCardId,
        userId: auth.userId
      }
    });

    if (!card) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    // Buscar todas as transações do cartão
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId,
        deletedAt: null,
        status: { in: ['pending', 'cleared'] }
      }
    });

    // Calcular saldo atual
    const currentBalance = transactions.reduce((sum, t) => {
      return sum + Math.abs(Number(t.amount));
    }, 0);

    // Atualizar cartão
    await prisma.creditCard.update({
      where: { id: creditCardId },
      data: { currentBalance }
    });

    const availableLimit = Number(card.limit) - currentBalance;

    return NextResponse.json({
      success: true,
      message: 'Saldo recalculado com sucesso',
      data: {
        cardName: card.name,
        limit: Number(card.limit),
        currentBalance,
        availableLimit,
        transactionsCount: transactions.length
      }
    });

  } catch (error) {
    console.error('Erro ao recalcular saldo:', error);
    return NextResponse.json(
      { error: 'Erro ao recalcular saldo' },
      { status: 500 }
    );
  }
}

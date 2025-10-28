import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/shared-debts
 * Criar ou atualizar dívida compartilhada
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { creditor, debtor, amount, description, transactionId } = await request.json();

    if (!creditor || !debtor || !amount) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: creditor, debtor, amount' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o usuário é parte da dívida
    if (creditor !== auth.userId && debtor !== auth.userId) {
      return NextResponse.json(
        { error: 'Usuário não autorizado para esta operação' },
        { status: 403 }
      );
    }

    // Verificar se já existe dívida ativa entre essas pessoas
    const existingDebt = await prisma.sharedDebt.findFirst({
      where: {
        creditor,
        debtor,
        status: 'active',
      },
    });

    let debt;

    if (existingDebt) {
      // Atualizar dívida existente
      debt = await prisma.sharedDebt.update({
        where: { id: existingDebt.id },
        data: {
          currentAmount: Number(existingDebt.currentAmount) + Number(amount),
          originalAmount: Number(existingDebt.originalAmount) + Number(amount),
          description: description || existingDebt.description,
          updatedAt: new Date(),
        },
      });
    } else {
      // Criar nova dívida
      debt = await prisma.sharedDebt.create({
        data: {
          creditor,
          debtor,
          originalAmount: amount,
          currentAmount: amount,
          description: description || 'Despesa compartilhada',
          transactionId,
          status: 'active',
        },
      });
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error('❌ Erro ao criar dívida:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar dívida' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shared-debts
 * Buscar dívidas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // ✅ CORREÇÃO CRÍTICA: Buscar apenas dívidas do usuário autenticado
    const debts = await prisma.sharedDebt.findMany({
      where: {
        OR: [
          { creditor: auth.userId },
          { debtor: auth.userId },
        ],
        status,
      },
      include: {
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Separar em "devo" e "me devem"
    const iOwe = debts.filter(d => d.debtor === auth.userId);
    const oweMe = debts.filter(d => d.creditor === auth.userId);

    return NextResponse.json({
      all: debts,
      iOwe,
      oweMe: oweMe,
      summary: {
        totalIOwe: iOwe.reduce((sum, d) => sum + Number(d.currentAmount), 0),
        totalOweMe: oweMe.reduce((sum, d) => sum + Number(d.currentAmount), 0),
      },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dívidas:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar dívidas' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shared-debts
 * Pagar/quitar dívida
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { debtId, amountPaid } = await request.json();

    if (!debtId || !amountPaid) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: debtId, amountPaid' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a dívida pertence ao usuário
    const debt = await prisma.sharedDebt.findFirst({
      where: { 
        id: debtId,
        OR: [
          { creditor: auth.userId },
          { debtor: auth.userId },
        ]
      },
    });

    if (!debt) {
      return NextResponse.json(
        { error: 'Dívida não encontrada ou não pertence ao usuário' }, 
        { status: 403 }
      );
    }

    const newAmount = Number(debt.currentAmount) - Number(amountPaid);

    const updatedDebt = await prisma.sharedDebt.update({
      where: { id: debtId },
      data: {
        currentAmount: Math.max(0, newAmount),
        status: newAmount <= 0 ? 'paid' : 'active',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedDebt);
  } catch (error) {
    console.error('❌ Erro ao pagar dívida:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar pagamento' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shared-debts/pay
 * Marcar dívida como paga
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { contactId, amount, paidDate, tripId } = await request.json();

    if (!contactId || !amount) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: contactId, amount' },
        { status: 400 }
      );
    }

    console.log('💰 [Pay Debt] Marcando como pago:', { contactId, amount, paidDate });

    // Buscar contato para obter o nome
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: auth.userId }
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      );
    }

    // Buscar dívidas ativas entre o usuário e o contato
    const activeDebts = await prisma.sharedDebt.findMany({
      where: {
        OR: [
          { creditor: 'user', debtor: contact.name, status: 'active' },
          { creditor: contact.name, debtor: 'user', status: 'active' }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    if (activeDebts.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma dívida ativa encontrada' },
        { status: 404 }
      );
    }

    let remainingAmount = Number(amount);
    const paidDebts = [];

    // Processar pagamento das dívidas (FIFO - First In, First Out)
    for (const debt of activeDebts) {
      if (remainingAmount <= 0) break;

      const debtAmount = Number(debt.currentAmount);
      const paymentAmount = Math.min(remainingAmount, debtAmount);

      if (paymentAmount >= debtAmount) {
        // Quitar dívida completamente
        await prisma.sharedDebt.update({
          where: { id: debt.id },
          data: {
            status: 'paid',
            paidAmount: debtAmount,
            paidAt: new Date(paidDate || new Date()),
            updatedAt: new Date()
          }
        });
        paidDebts.push({ ...debt, paidAmount: debtAmount, status: 'paid' });
      } else {
        // Pagamento parcial
        await prisma.sharedDebt.update({
          where: { id: debt.id },
          data: {
            currentAmount: debtAmount - paymentAmount,
            paidAmount: Number(debt.paidAmount || 0) + paymentAmount,
            updatedAt: new Date()
          }
        });
        paidDebts.push({ ...debt, paidAmount: paymentAmount, status: 'partial' });
      }

      remainingAmount -= paymentAmount;
    }

    // Criar registro de pagamento
    const paymentRecord = await prisma.debtPayment.create({
      data: {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: auth.userId,
        contactId,
        contactName: contact.name,
        amount: Number(amount),
        paidDate: new Date(paidDate || new Date()),
        description: tripId ? `Pagamento viagem - ${contact.name}` : `Pagamento para ${contact.name}`,
        debtsAffected: paidDebts.map(d => d.id)
      }
    });

    console.log('✅ [Pay Debt] Pagamento registrado:', paymentRecord.id);

    return NextResponse.json({
      success: true,
      message: `Pagamento de R$ ${Number(amount).toFixed(2)} registrado com sucesso!`,
      data: {
        payment: paymentRecord,
        debtsAffected: paidDebts,
        remainingAmount
      }
    });

  } catch (error) {
    console.error('❌ [Pay Debt] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * API: Pagar Fatura de Cartão de Crédito
 * Registra pagamento, atualiza fatura e devolve limite ao cartão
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; invoiceId: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: cardId, invoiceId } = params;
    const body = await request.json();
    const { amount, paymentDate, accountId, fullPayment } = body;

    console.log('💳 [Invoice Payment] Registrando pagamento:', {
      cardId,
      invoiceId,
      amount,
      paymentDate,
      accountId,
      fullPayment
    });

    // Validações
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Conta não selecionada' }, { status: 400 });
    }

    // Buscar fatura
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { creditCard: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
    }

    if (invoice.creditCard.userId !== auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar conta
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account || account.userId !== auth.userId) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Usar transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar ou criar categoria de pagamento de fatura
      let paymentCategory = await tx.category.findFirst({
        where: {
          userId: auth.userId!,
          name: 'Pagamento de Fatura'
        }
      });

      if (!paymentCategory) {
        // Criar categoria se não existir
        paymentCategory = await tx.category.create({
          data: {
            userId: auth.userId!,
            name: 'Pagamento de Fatura',
            type: 'expense',
            icon: '💳',
            color: '#FF6B6B'
          }
        });
      }

      // 2. Criar transação de DESPESA (saída de dinheiro da conta)
      const transaction = await tx.transaction.create({
        data: {
          userId: auth.userId!,
          accountId: accountId,
          amount: -Math.abs(amount), // Negativo para despesa
          description: `Pagamento Fatura ${invoice.creditCard.name} - ${invoice.month}/${invoice.year}`,
          type: 'DESPESA',
          date: new Date(paymentDate),
          status: 'cleared',
          creditCardId: cardId,
          invoiceId: invoiceId,
          categoryId: paymentCategory.id,
        }
      });

      // 3. Atualizar fatura
      const newPaidAmount = Number(invoice.paidAmount) + amount;
      const isPaid = fullPayment || newPaidAmount >= Number(invoice.totalAmount);

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          isPaid: isPaid,
          status: isPaid ? 'paid' : newPaidAmount > 0 ? 'partial' : 'open',
          paidAt: isPaid ? new Date(paymentDate) : null
        }
      });

      // 4. Atualizar limite disponível do cartão (devolver o valor pago)
      const updatedCard = await tx.creditCard.update({
        where: { id: cardId },
        data: {
          currentBalance: {
            decrement: amount // Diminuir saldo usado = aumentar limite disponível
          }
        }
      });

      console.log('✅ [Invoice Payment] Pagamento registrado:', {
        transactionId: transaction.id,
        newPaidAmount,
        isPaid,
        newCardBalance: updatedCard.currentBalance
      });

      return {
        transaction,
        invoice: updatedInvoice,
        card: updatedCard
      };
    });

    return NextResponse.json({
      success: true,
      message: fullPayment 
        ? 'Fatura paga com sucesso!' 
        : `Pagamento parcial de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrado!`,
      data: result
    });

  } catch (error) {
    console.error('❌ [Invoice Payment] Erro:', error);
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

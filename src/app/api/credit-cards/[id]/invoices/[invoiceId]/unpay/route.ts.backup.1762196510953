import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * API: Reverter Pagamento de Fatura de Cartão de Crédito
 * Desmarca a fatura como paga e atualiza status das transações para pending
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

    console.log('🔄 [Invoice Unpay] Revertendo pagamento:', {
      cardId,
      invoiceId
    });

    // Buscar fatura
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { 
        creditCard: true,
        transactions: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
    }

    if (invoice.creditCard.userId !== auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (!invoice.isPaid && Number(invoice.paidAmount) === 0) {
      return NextResponse.json({ error: 'Fatura já está em aberto' }, { status: 400 });
    }

    // Usar transação para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar transações de pagamento da fatura
      const paymentTransactions = await tx.transaction.findMany({
        where: {
          invoiceId: invoiceId,
          creditCardId: cardId,
          type: 'DESPESA',
          description: {
            contains: 'Pagamento Fatura'
          }
        }
      });

      console.log('🔍 [Invoice Unpay] Transações de pagamento encontradas:', {
        count: paymentTransactions.length,
        transactions: paymentTransactions.map(t => ({
          id: t.id,
          amount: t.amount,
          accountId: t.accountId,
          description: t.description
        }))
      });

      // 2. ✅ REVERTER SALDO DAS CONTAS antes de deletar as transações
      for (const payment of paymentTransactions) {
        if (payment.accountId) {
          // Reverter o débito da conta (adicionar o valor de volta)
          const account = await tx.account.update({
            where: { id: payment.accountId },
            data: {
              balance: {
                increment: Math.abs(Number(payment.amount)) // Devolver o dinheiro para a conta
              }
            }
          });

          console.log('💰 [Invoice Unpay] Saldo da conta revertido:', {
            accountId: payment.accountId,
            amount: Math.abs(Number(payment.amount)),
            newBalance: account.balance
          });
        }

        // 3. Deletar transação de pagamento (soft delete)
        await tx.transaction.update({
          where: { id: payment.id },
          data: {
            deletedAt: new Date(),
            status: 'cancelled'
          }
        });
      }

      // 4. ✅ ATUALIZAR STATUS DAS TRANSAÇÕES DA FATURA PARA PENDING
      await tx.transaction.updateMany({
        where: {
          invoiceId: invoiceId,
          creditCardId: cardId,
          deletedAt: null
        },
        data: {
          status: 'pending'
        }
      });

      // 5. Atualizar fatura para não paga
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: 0,
          isPaid: false,
          status: 'open',
          paidAt: null
        }
      });

      // 6. Restaurar limite do cartão (voltar o saldo usado)
      const totalPaid = Number(invoice.paidAmount);
      const updatedCard = await tx.creditCard.update({
        where: { id: cardId },
        data: {
          currentBalance: {
            increment: totalPaid // Aumentar saldo usado = diminuir limite disponível
          }
        }
      });

      console.log('✅ [Invoice Unpay] Pagamento revertido:', {
        deletedPayments: paymentTransactions.length,
        updatedTransactions: invoice.transactions.length,
        restoredAmount: totalPaid,
        newCardBalance: updatedCard.currentBalance
      });

      return {
        invoice: updatedInvoice,
        card: updatedCard,
        deletedPayments: paymentTransactions.length,
        updatedTransactions: invoice.transactions.length
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Pagamento da fatura revertido com sucesso!',
      data: result
    });

  } catch (error) {
    console.error('❌ [Invoice Unpay] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao reverter pagamento',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

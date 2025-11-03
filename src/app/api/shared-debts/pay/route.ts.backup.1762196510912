import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { handleApiError } from '@/lib/utils/error-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Processar pagamento de dívida compartilhada com atomicidade
 * Garante que todas as transações sejam criadas ou nenhuma
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId!;

    const body = await request.json();
    const {
      debtId,
      creditorId,
      creditorAccountId,
      debtorAccountId,
      amount,
      totalDebt,
      totalCredit,
      description,
      category,
      date,
      isCompensation, // true quando netAmount = 0
    } = body;

    console.log('💰 Processando pagamento de dívida:', {
      debtId,
      amount,
      isCompensation,
    });

    // ✅ ATOMICIDADE: Usar transação do Prisma
    const result = await prisma.$transaction(async (tx) => {
      const transactions = [];

      if (isCompensation) {
        // ✅ COMPENSAÇÃO TOTAL: Criar 4 transações
        console.log('🔄 Compensação total detectada');

        // TRANSAÇÃO 1: RECEITA para o credor
        const creditorReceita = await tx.transaction.create({
          data: {
            userId: creditorId,
            accountId: creditorAccountId,
            categoryId: 'reembolso',
            amount: totalDebt,
            description: `Recebimento - ${description} (Compensado)`,
            type: 'RECEITA',
            date: new Date(date),
            status: 'cleared',
            notes: `Compensação total. Recebido R$ ${totalDebt.toFixed(2)} e pago R$ ${totalCredit.toFixed(2)}`,
          },
        });
        transactions.push(creditorReceita);

        // TRANSAÇÃO 2: DESPESA para o credor
        const creditorDespesa = await tx.transaction.create({
          data: {
            userId: creditorId,
            accountId: creditorAccountId,
            categoryId: 'reembolso',
            amount: -totalCredit,
            description: `Pagamento - Compensação de dívidas`,
            type: 'DESPESA',
            date: new Date(date),
            status: 'cleared',
            notes: `Compensação total. Saldo líquido: R$ 0,00`,
          },
        });
        transactions.push(creditorDespesa);

        // TRANSAÇÃO 3: RECEITA para o devedor
        const debtorReceita = await tx.transaction.create({
          data: {
            userId,
            accountId: debtorAccountId,
            categoryId: 'reembolso',
            amount: totalCredit,
            description: `Recebimento - Compensação de dívidas`,
            type: 'RECEITA',
            date: new Date(date),
            status: 'cleared',
            notes: `Compensação total. Saldo líquido: R$ 0,00`,
          },
        });
        transactions.push(debtorReceita);

        // TRANSAÇÃO 4: DESPESA para o devedor
        const debtorDespesa = await tx.transaction.create({
          data: {
            userId,
            accountId: debtorAccountId,
            categoryId: category,
            amount: -totalDebt,
            description: `Pagamento - ${description} (Compensado)`,
            type: 'DESPESA',
            date: new Date(date),
            status: 'cleared',
            notes: `Compensação total. Recebido R$ ${totalCredit.toFixed(2)} e pago R$ ${totalDebt.toFixed(2)}`,
          },
        });
        transactions.push(debtorDespesa);
      } else {
        // ✅ PAGAMENTO NORMAL: Criar 2 transações
        console.log('💵 Pagamento normal');

        // TRANSAÇÃO 1: RECEITA para o credor
        const creditorReceita = await tx.transaction.create({
          data: {
            userId: creditorId,
            accountId: creditorAccountId,
            categoryId: 'reembolso',
            amount: amount,
            description: `Recebimento - ${description}`,
            type: 'RECEITA',
            date: new Date(date),
            status: 'cleared',
            notes: totalCredit > 0
              ? `Recebido. Compensado R$ ${totalCredit.toFixed(2)} de créditos`
              : `Recebido`,
          },
        });
        transactions.push(creditorReceita);

        // TRANSAÇÃO 2: DESPESA para o devedor
        const debtorDespesa = await tx.transaction.create({
          data: {
            userId,
            accountId: debtorAccountId,
            categoryId: category,
            amount: -amount,
            description: `Pagamento - ${description}`,
            type: 'DESPESA',
            date: new Date(date),
            status: 'cleared',
            notes: totalCredit > 0
              ? `Pago. Compensado R$ ${totalCredit.toFixed(2)} de créditos`
              : `Pago`,
          },
        });
        transactions.push(debtorDespesa);
      }

      // Atualizar saldos das contas
      for (const transaction of transactions) {
        await tx.account.update({
          where: { id: transaction.accountId! },
          data: {
            balance: {
              increment: Number(transaction.amount),
            },
          },
        });
      }

      // Marcar dívida como paga
      if (debtId) {
        await tx.sharedDebt.update({
          where: { id: debtId },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });
      }

      return { transactions, success: true };
    });

    console.log('✅ Pagamento processado com sucesso:', result.transactions.length, 'transações criadas');

    return NextResponse.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      transactionsCreated: result.transactions.length,
    });
  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
    return handleApiError(error);
  }
}

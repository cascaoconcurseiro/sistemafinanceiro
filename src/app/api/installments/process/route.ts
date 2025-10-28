import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * POST /api/installments/process
 * Processa parcelas vencidas (cria transações)
 * Este endpoint deve ser chamado por um cron job diariamente
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔄 [Installments] Processando parcelas vencidas...');

    // Buscar parcelas pendentes que venceram
    const dueInstallments = await prisma.installment.findMany({
      where: {
        userId: auth.userId,
        status: 'pending',
        dueDate: { lte: today },
      },
      include: {
        // Buscar transação original para copiar dados
      },
    });

    console.log(`📊 [Installments] Encontradas ${dueInstallments.length} parcelas vencidas`);

    if (dueInstallments.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma parcela para processar',
        processed: 0,
      });
    }

    // Processar cada parcela
    const processed = [];
    for (const installment of dueInstallments) {
      try {
        // Buscar transação original
        const originalTransaction = await prisma.transaction.findUnique({
          where: { id: installment.transactionId },
        });

        if (!originalTransaction) {
          console.error(`❌ Transação ${installment.transactionId} não encontrada`);
          continue;
        }

        // Criar nova transação para a parcela
        const newTransaction = await prisma.transaction.create({
          data: {
            userId: auth.userId,
            accountId: originalTransaction.accountId,
            categoryId: originalTransaction.categoryId,
            amount: installment.amount,
            description: `${originalTransaction.description} - ${installment.description}`,
            type: originalTransaction.type,
            date: installment.dueDate,
            status: 'cleared',
            isInstallment: true,
            installmentNumber: installment.installmentNumber,
            totalInstallments: installment.totalInstallments,
            parentTransactionId: installment.transactionId,
            creditCardId: originalTransaction.creditCardId,
            tripId: originalTransaction.tripId,
            goalId: originalTransaction.goalId,
          },
        });

        // Marcar parcela como paga
        await prisma.installment.update({
          where: { id: installment.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
          },
        });

        // Atualizar saldo da conta
        if (originalTransaction.accountId) {
          await prisma.account.update({
            where: { id: originalTransaction.accountId },
            data: {
              balance: {
                decrement: Math.abs(Number(installment.amount)),
              },
            },
          });
        }

        processed.push({
          installmentId: installment.id,
          transactionId: newTransaction.id,
          amount: installment.amount,
        });

        console.log(`✅ Parcela ${installment.installmentNumber}/${installment.totalInstallments} processada`);
      } catch (error) {
        console.error(`❌ Erro ao processar parcela ${installment.id}:`, error);
      }
    }

    console.log(`🎉 [Installments] ${processed.length} parcelas processadas com sucesso`);

    return NextResponse.json({
      message: 'Parcelas processadas com sucesso',
      processed: processed.length,
      details: processed,
    });
  } catch (error) {
    console.error('❌ [API Installments] Erro ao processar:', error);
    return NextResponse.json(
      { error: 'Erro ao processar parcelas' },
      { status: 500 }
    );
  }
}

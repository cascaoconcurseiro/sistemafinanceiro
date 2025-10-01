import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { broadcastEvent, EventTypes } from '../../../events/route';
import { createReversalTransaction, logTransactionAudit, recalculateAccountBalance } from '@/lib/transaction-audit';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// POST - Criar estorno de transação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar transação original
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!originalTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a transação já foi estornada
    const existingReversal = await prisma.transaction.findFirst({
      where: { reversalOf: id }
    });

    if (existingReversal) {
      return NextResponse.json(
        { error: 'Esta transação já foi estornada' },
        { status: 400 }
      );
    }

    // Criar transação de estorno
    const result = await prisma.$transaction(async (tx) => {
      const reversalTransaction = await createReversalTransaction(
        originalTransaction,
        body.reason || 'Estorno solicitado',
        tx
      );

      // Recalcular saldo da conta
      const newBalance = await recalculateAccountBalance(originalTransaction.accountId, tx);

      // Atualizar saldo da conta
      await tx.account.update({
        where: { id: originalTransaction.accountId },
        data: { balance: newBalance }
      });

      return { reversalTransaction, newBalance };
    });

    const { reversalTransaction, newBalance } = result;

    console.log('✅ Estorno criado e saldo recalculado:', {
      originalTransactionId: id,
      reversalTransactionId: reversalTransaction.id,
      accountId: originalTransaction.accountId,
      newBalance
    });

    // Emitir evento de transação criada (estorno)
    broadcastEvent(EventTypes.TRANSACTION_CREATED, {
      ...reversalTransaction,
      amount: Number(reversalTransaction.amount),
      status: reversalTransaction.status || 'cleared'
    });

    // Emitir evento de atualização de saldo
    broadcastEvent(EventTypes.BALANCE_UPDATED, {
      accountId: originalTransaction.accountId,
      transactionId: reversalTransaction.id,
      amount: Number(reversalTransaction.amount),
      type: reversalTransaction.type,
      newBalance
    });

    return NextResponse.json({
      ...reversalTransaction,
      amount: Number(reversalTransaction.amount),
      status: reversalTransaction.status || 'cleared'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar estorno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
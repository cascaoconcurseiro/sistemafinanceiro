import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { broadcastEvent, EventTypes } from '../events/route';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET - Buscar transações agendadas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dueDate = searchParams.get('dueDate');
    const status = searchParams.get('status') || 'PENDING';

    let whereClause: any = {
      status: status,
    };

    // Filtrar por data de vencimento se especificado
    if (dueDate) {
      whereClause.scheduledDate = {
        lte: new Date(dueDate)
      };
    }

    const scheduledTransactions = await prisma.scheduledTransaction.findMany({
      where: whereClause,
      orderBy: { scheduledDate: 'asc' },
      include: {
        account: true
      }
    });

    console.log('🔍 API /scheduled-transactions - Retornando:', scheduledTransactions.length, 'transações agendadas');

    return NextResponse.json(scheduledTransactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount)
    })));
  } catch (error) {
    console.error('❌ Erro ao buscar transações agendadas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova transação agendada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const scheduledTransaction = await prisma.scheduledTransaction.create({
      data: {
        description: body.description,
        amount: body.amount,
        type: body.type || 'expense',
        category: body.category || 'Outros',
        accountId: body.accountId,
        scheduledDate: new Date(body.scheduledDate),
        status: 'PENDING',
        parentTransactionId: body.parentTransactionId,
        installmentNumber: body.installmentNumber,
        totalInstallments: body.totalInstallments,
        tripId: body.tripId,
        sharedWith: body.sharedWith,
        notes: body.notes
      },
      include: {
        account: true
      }
    });

    console.log('✅ Transação agendada criada:', {
      id: scheduledTransaction.id,
      scheduledDate: scheduledTransaction.scheduledDate,
      installmentNumber: scheduledTransaction.installmentNumber
    });

    return NextResponse.json({
      ...scheduledTransaction,
      amount: Number(scheduledTransaction.amount)
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar transação agendada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Processar transações agendadas vencidas
export async function PATCH(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final do dia

    // Buscar transações agendadas vencidas
    const dueTransactions = await prisma.scheduledTransaction.findMany({
      where: {
        scheduledDate: {
          lte: today
        },
        status: 'PENDING'
      },
      include: {
        account: true
      }
    });

    const processedTransactions = [];

    for (const scheduledTx of dueTransactions) {
      try {
        // Criar transação real no banco
        const result = await prisma.$transaction(async (tx) => {
          // Criar a transação
          const transaction = await tx.transaction.create({
            data: {
              description: scheduledTx.description,
              amount: scheduledTx.amount,
              type: scheduledTx.type,
              category: scheduledTx.category,
              accountId: scheduledTx.accountId,
              date: scheduledTx.scheduledDate,
              status: 'cleared',
              parentTransactionId: scheduledTx.parentTransactionId,
              installmentNumber: scheduledTx.installmentNumber,
              totalInstallments: scheduledTx.totalInstallments,
              tripId: scheduledTx.tripId
            },
            include: {
              account: true
            }
          });

          // Recalcular saldo da conta
          const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
          const newBalance = await recalculateAccountBalance(scheduledTx.accountId, tx);

          // Marcar transação agendada como processada
          await tx.scheduledTransaction.update({
            where: { id: scheduledTx.id },
            data: { status: 'PROCESSED' }
          });

          return { transaction, newBalance };
        });

        const { transaction, newBalance } = result;

        // Se for transação compartilhada, criar billing payments
        if (scheduledTx.sharedWith && scheduledTx.sharedWith.length > 0) {
          const { storage } = await import('@/lib/storage');
          const transactionForBilling = {
            ...transaction,
            sharedWith: scheduledTx.sharedWith,
            amount: Number(transaction.amount)
          };
          storage.createBillingPayments(transactionForBilling);
        }

        // Emitir eventos
        broadcastEvent(EventTypes.TRANSACTION_CREATED, {
          ...transaction,
          amount: Number(transaction.amount),
          status: transaction.status || 'completed'
        });

        broadcastEvent(EventTypes.BALANCE_UPDATED, {
          accountId: transaction.accountId,
          transactionId: transaction.id,
          amount: Number(transaction.amount),
          type: transaction.type,
          newBalance
        });

        processedTransactions.push(transaction);

        console.log('✅ Transação agendada processada:', {
          scheduledId: scheduledTx.id,
          transactionId: transaction.id,
          installment: `${scheduledTx.installmentNumber}/${scheduledTx.totalInstallments}`
        });

      } catch (error) {
        console.error('❌ Erro ao processar transação agendada:', scheduledTx.id, error);
      }
    }

    return NextResponse.json({
      processed: processedTransactions.length,
      transactions: processedTransactions.map(t => ({
        ...t,
        amount: Number(t.amount)
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao processar transações agendadas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { broadcastEvent, EventTypes } from '../events/route';
import { validateCreateTransaction, CreateTransactionData } from '@/lib/transaction-validation';
import { logTransactionAudit, recalculateAccountBalance } from '@/lib/transaction-audit';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// GET - Buscar transações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let whereClause: any = {};

    // Filtrar por tipo se especificado
    if (type && type !== 'all') {
      whereClause.type = type;
    }

    // Filtrar por período se especificado
    if (year && month) {
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // Filtrar por range de datas se especificado
    if (start && end) {
      whereClause.date = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
      include: {
        account: true
      }
    });

    console.log('🔍 API /transactions - Retornando:', transactions.length, 'transações');

    return NextResponse.json(transactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      status: transaction.status || 'completed'
    })));
  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova transação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Determinar o tipo correto da transação
    let transactionType = body.type || 'debit';
    
    // Se for uma transação compartilhada, manter o tipo como 'shared'
    if (body.type === 'shared' || (body.sharedWith && body.sharedWith.length > 0)) {
      transactionType = 'shared';
    }
    
    // Validação usando a nova biblioteca
    const transactionData: CreateTransactionData = {
      description: body.description,
      amount: body.amount,
      type: transactionType,
      category: body.category || 'Outros',
      accountId: body.accountId,
      date: body.date ? new Date(body.date) : new Date(),
      status: body.status || 'cleared',
      isRecurring: body.isRecurring || false,
      transferId: body.transferId,
      parentTransactionId: body.parentTransactionId,
      installmentNumber: body.installmentNumber,
      totalInstallments: body.totalInstallments,
      tripId: body.tripId
    };

    const validation = await validateCreateTransaction(transactionData, prisma);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Criar transação e atualizar saldo da conta em uma transação do banco
    const result = await prisma.$transaction(async (tx) => {
      // Criar a transação
      const transaction = await tx.transaction.create({
        data: {
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          category: transactionData.category,
          accountId: transactionData.accountId,
          date: transactionData.date,
          status: transactionData.status,
          isRecurring: transactionData.isRecurring,
          transferId: transactionData.transferId,
          parentTransactionId: transactionData.parentTransactionId,
          installmentNumber: transactionData.installmentNumber,
          totalInstallments: transactionData.totalInstallments,
          tripId: transactionData.tripId
        },
        include: {
          account: true
        }
      });

      // Se for transação compartilhada, criar registros SharedExpense
      if (transactionData.type === 'shared' && body.sharedWith && body.sharedWith.length > 0) {
        const totalParticipants = body.sharedWith.length + 1; // +1 para incluir o usuário atual
        const shareAmount = Math.abs(Number(transactionData.amount)) / totalParticipants;
        
        // Criar registro para cada participante
        for (const participant of body.sharedWith) {
          await tx.sharedExpense.create({
            data: {
              transactionId: transaction.id,
              userId: participant.contactId,
              accountId: transactionData.accountId,
              shareAmount: shareAmount,
              sharePercentage: participant.percentage || (100 / totalParticipants),
              status: 'PENDING'
            }
          });
        }
      }

      // Recalcular saldo da conta usando a nova função
      const newBalance = await recalculateAccountBalance(transactionData.accountId, tx);

      // Log de auditoria
      await logTransactionAudit(
        transaction.id,
        'CREATE',
        null,
        transaction,
        tx
      );

      return { transaction, newBalance };
    });

    const { transaction, newBalance } = result;

    console.log('✅ Transação criada e saldo atualizado:', {
      transactionId: transaction.id,
      accountId: transaction.accountId,
      newBalance
    });

    // Emitir evento de transação criada
    broadcastEvent(EventTypes.TRANSACTION_CREATED, {
      ...transaction,
      amount: Number(transaction.amount),
      status: transaction.status || 'completed'
    });

    // Emitir evento de atualização de saldo
    broadcastEvent(EventTypes.BALANCE_UPDATED, {
      accountId: transaction.accountId,
      transactionId: transaction.id,
      amount: Number(transaction.amount),
      type: transaction.type,
      newBalance
    });

    return NextResponse.json({
      ...transaction,
      amount: Number(transaction.amount),
      status: transaction.status || 'completed'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

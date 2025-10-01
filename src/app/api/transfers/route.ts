import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { broadcastEvent, EventTypes } from '../events/route';
import { validateTransferCompleteness, validateTransferAmounts, TransferData } from '@/lib/transaction-validation';
import { logTransactionAudit, recalculateAccountBalance } from '@/lib/transaction-audit';
import { v4 as uuidv4 } from 'uuid';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// POST - Criar transferência atômica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação dos dados da transferência
    const transferData: TransferData = {
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      amount: body.amount,
      description: body.description || 'Transferência entre contas',
      date: body.date ? new Date(body.date) : new Date(),
      category: body.category || 'Transferência'
    };

    // Validações obrigatórias
    const completenessValidation = validateTransferCompleteness(transferData);
    if (!completenessValidation.isValid) {
      return NextResponse.json(
        { error: completenessValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    const amountValidation = validateTransferAmounts(transferData);
    if (!amountValidation.isValid) {
      return NextResponse.json(
        { error: amountValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Verificar se as contas existem
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findUnique({ where: { id: transferData.fromAccountId } }),
      prisma.account.findUnique({ where: { id: transferData.toAccountId } })
    ]);

    if (!fromAccount) {
      return NextResponse.json(
        { error: 'Conta de origem não encontrada' },
        { status: 404 }
      );
    }

    if (!toAccount) {
      return NextResponse.json(
        { error: 'Conta de destino não encontrada' },
        { status: 404 }
      );
    }

    // Criar transferência atômica
    const transferId = uuidv4();
    
    const result = await prisma.$transaction(async (tx) => {
      // Criar transação de débito na conta origem
      const debitTransaction = await tx.transaction.create({
        data: {
          description: `${transferData.description} (Saída)`,
          amount: Math.abs(transferData.amount),
          type: 'debit',
          category: transferData.category,
          accountId: transferData.fromAccountId,
          date: transferData.date,
          status: 'cleared',
          transferId: transferId,
          transferType: 'outgoing'
        }
      });

      // Criar transação de crédito na conta destino
      const creditTransaction = await tx.transaction.create({
        data: {
          description: `${transferData.description} (Entrada)`,
          amount: Math.abs(transferData.amount),
          type: 'credit',
          category: transferData.category,
          accountId: transferData.toAccountId,
          date: transferData.date,
          status: 'cleared',
          transferId: transferId,
          transferType: 'incoming'
        }
      });

      // Recalcular saldos das duas contas
      const [fromBalance, toBalance] = await Promise.all([
        recalculateAccountBalance(transferData.fromAccountId, tx),
        recalculateAccountBalance(transferData.toAccountId, tx)
      ]);

      // Atualizar saldos das contas
      await Promise.all([
        tx.account.update({
          where: { id: transferData.fromAccountId },
          data: { balance: fromBalance }
        }),
        tx.account.update({
          where: { id: transferData.toAccountId },
          data: { balance: toBalance }
        })
      ]);

      // Log de auditoria para ambas as transações
      await Promise.all([
        logTransactionAudit(debitTransaction.id, 'CREATE', null, debitTransaction, tx),
        logTransactionAudit(creditTransaction.id, 'CREATE', null, creditTransaction, tx)
      ]);

      return {
        transferId,
        debitTransaction,
        creditTransaction,
        fromBalance,
        toBalance
      };
    });

    const { transferId: createdTransferId, debitTransaction, creditTransaction, fromBalance, toBalance } = result;

    console.log('✅ Transferência atômica criada:', {
      transferId: createdTransferId,
      fromAccountId: transferData.fromAccountId,
      toAccountId: transferData.toAccountId,
      amount: transferData.amount,
      fromBalance,
      toBalance
    });

    // Emitir eventos para ambas as transações
    broadcastEvent(EventTypes.TRANSACTION_CREATED, {
      ...debitTransaction,
      amount: Number(debitTransaction.amount)
    });

    broadcastEvent(EventTypes.TRANSACTION_CREATED, {
      ...creditTransaction,
      amount: Number(creditTransaction.amount)
    });

    // Emitir eventos de atualização de saldo para ambas as contas
    broadcastEvent(EventTypes.BALANCE_UPDATED, {
      accountId: transferData.fromAccountId,
      transactionId: debitTransaction.id,
      amount: -Number(debitTransaction.amount),
      type: 'debit',
      newBalance: fromBalance
    });

    broadcastEvent(EventTypes.BALANCE_UPDATED, {
      accountId: transferData.toAccountId,
      transactionId: creditTransaction.id,
      amount: Number(creditTransaction.amount),
      type: 'credit',
      newBalance: toBalance
    });

    return NextResponse.json({
      transferId: createdTransferId,
      debitTransaction: {
        ...debitTransaction,
        amount: Number(debitTransaction.amount)
      },
      creditTransaction: {
        ...creditTransaction,
        amount: Number(creditTransaction.amount)
      },
      fromBalance,
      toBalance
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar transferência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Buscar transferências
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const accountId = searchParams.get('accountId');

    let whereClause: any = {
      transferId: { not: null }
    };

    // Filtrar por conta se especificado
    if (accountId) {
      whereClause.accountId = accountId;
    }

    const transfers = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });

    // Agrupar transações por transferId
    const groupedTransfers = transfers.reduce((acc, transaction) => {
      const transferId = transaction.transferId!;
      if (!acc[transferId]) {
        acc[transferId] = [];
      }
      acc[transferId].push({
        ...transaction,
        amount: Number(transaction.amount)
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Converter para array de transferências completas
    const completeTransfers = Object.entries(groupedTransfers).map(([transferId, transactions]) => {
      const debitTransaction = transactions.find(t => t.type === 'debit');
      const creditTransaction = transactions.find(t => t.type === 'credit');
      
      return {
        transferId,
        amount: debitTransaction?.amount || creditTransaction?.amount || 0,
        date: debitTransaction?.date || creditTransaction?.date,
        description: debitTransaction?.description?.replace(' (Saída)', '') || 
                    creditTransaction?.description?.replace(' (Entrada)', ''),
        category: debitTransaction?.category || creditTransaction?.category,
        fromAccount: debitTransaction?.account,
        toAccount: creditTransaction?.account,
        debitTransaction,
        creditTransaction
      };
    });

    return NextResponse.json(completeTransfers);
  } catch (error) {
    console.error('❌ Erro ao buscar transferências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
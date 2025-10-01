import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { broadcastEvent, EventTypes } from '../../events/route';
import { canEditTransaction, canDeleteTransaction, logTransactionAudit, recalculateAccountBalance, createReversalTransaction } from '@/lib/transaction-audit';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// PUT - Atualizar transação existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validação básica
    if (!body.description && !body.amount && !body.type && !body.category && !body.accountId && !body.date && !body.status) {
      return NextResponse.json(
        { error: 'Pelo menos um campo deve ser fornecido para atualização' },
        { status: 400 }
      );
    }

    // Buscar transação existente
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a transação pode ser editada
    const canEdit = canEditTransaction(existingTransaction);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Esta transação não pode ser editada' },
        { status: 400 }
      );
    }

    // Atualizar transação e recalcular saldo da conta em uma transação do banco
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar a transação
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          description: body.description || existingTransaction.description,
          amount: body.amount !== undefined ? body.amount : existingTransaction.amount,
          type: body.type || existingTransaction.type,
          category: body.category || existingTransaction.category,
          accountId: body.accountId || existingTransaction.accountId,
          date: body.date ? new Date(body.date) : existingTransaction.date,
          status: body.status || existingTransaction.status,
          isRecurring: body.isRecurring !== undefined ? body.isRecurring : existingTransaction.isRecurring
        },
        include: { account: true }
      });

      // Recalcular saldo da conta usando a nova função
      const newBalance = await recalculateAccountBalance(updatedTransaction.accountId, tx);

      // Atualizar saldo da conta
      await tx.account.update({
        where: { id: updatedTransaction.accountId },
        data: { balance: newBalance }
      });

      // Log de auditoria
      await logTransactionAudit(
        id,
        'UPDATE',
        existingTransaction,
        updatedTransaction,
        tx
      );

      return { transaction: updatedTransaction, newBalance };
    });

    const { transaction, newBalance } = result;

    console.log('✅ Transação atualizada e saldo recalculado:', {
      transactionId: transaction.id,
      accountId: transaction.accountId,
      newBalance
    });

    // Emitir evento de transação atualizada
    broadcastEvent(EventTypes.TRANSACTION_UPDATED, {
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
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar transação (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar transação existente
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a transação pode ser deletada
    const canDelete = canDeleteTransaction(existingTransaction);
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Esta transação não pode ser excluída' },
        { status: 400 }
      );
    }

    // Soft delete da transação e recalcular saldo da conta
    const result = await prisma.$transaction(async (tx) => {
      // Soft delete da transação
      const deletedTransaction = await tx.transaction.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      // Recalcular saldo da conta usando a nova função
      const newBalance = await recalculateAccountBalance(existingTransaction.accountId, tx);

      // Atualizar saldo da conta
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: { balance: newBalance }
      });

      // Log de auditoria
      await logTransactionAudit(
        id,
        'DELETE',
        existingTransaction,
        null,
        tx
      );

      return { newBalance, deletedTransaction };
    });

    const { newBalance } = result;

    console.log('✅ Transação deletada e saldo recalculado:', {
      transactionId: id,
      accountId: existingTransaction.accountId,
      newBalance
    });

    // Emitir evento de transação deletada
    broadcastEvent(EventTypes.TRANSACTION_DELETED, {
      id: existingTransaction.id,
      accountId: existingTransaction.accountId,
      amount: Number(existingTransaction.amount),
      type: existingTransaction.type
    });

    // Emitir evento de atualização de saldo
    broadcastEvent(EventTypes.BALANCE_UPDATED, {
      accountId: existingTransaction.accountId,
      transactionId: existingTransaction.id,
      amount: Number(existingTransaction.amount),
      type: existingTransaction.type,
      newBalance,
      action: 'deleted'
    });

    return NextResponse.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Buscar transação específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
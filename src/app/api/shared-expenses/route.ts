import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../../../lib/logger';

const prisma = new PrismaClient();

// GET - Buscar transações compartilhadas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Buscar transações que têm sharedWith no metadata
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'expense',
        // Buscar transações que têm informações de compartilhamento no metadata
        OR: [
          {
            description: {
              contains: 'shared',
              mode: 'insensitive'
            }
          },
          {
            // Aqui podemos adicionar outros critérios para identificar transações compartilhadas
            // Por enquanto, vamos usar uma abordagem simples
            type: 'expense'
          }
        ]
      },
      include: {
        account: true
      },
      orderBy: {
        date: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.transaction.count({
      where: {
        type: 'expense'
      }
    });

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return handleApiError(error, 'Erro ao buscar transações compartilhadas');
  }
}

// POST - Criar transação compartilhada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      amount,
      accountId,
      category,
      date,
      sharedWith,
      sharedPercentages,
      notes
    } = body;

    // Validações básicas
    if (!description || !amount || !accountId || !category || !date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: description, amount, accountId, category, date' },
        { status: 400 }
      );
    }

    if (!sharedWith || !Array.isArray(sharedWith) || sharedWith.length === 0) {
      return NextResponse.json(
        { error: 'Campo sharedWith é obrigatório e deve ser um array não vazio' },
        { status: 400 }
      );
    }

    // Criar a transação principal
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount),
        accountId,
        category,
        type: 'expense',
        date: new Date(date),
        status: 'cleared'
      },
      include: {
        account: true
      }
    });

    // Atualizar saldo da conta
    await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          decrement: parseFloat(amount)
        }
      }
    });

    // Criar registros de SharedExpense para cada participante
    const sharedExpenses = [];
    const totalParticipants = sharedWith.length + 1; // +1 para incluir o pagador
    
    for (const participantId of sharedWith) {
      const sharePercentage = sharedPercentages?.[participantId] || (100 / totalParticipants);
      const shareAmount = (parseFloat(amount) * sharePercentage) / 100;

      const sharedExpense = await prisma.sharedExpense.create({
        data: {
          transactionId: transaction.id,
          userId: participantId,
          accountId: accountId,
          shareAmount: shareAmount,
          sharePercentage: sharePercentage,
          status: 'PENDING',
          notes: notes || null
        }
      });

      sharedExpenses.push(sharedExpense);
    }

    return NextResponse.json({
      transaction,
      sharedExpenses,
      message: 'Transação compartilhada criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error, 'Erro ao criar transação compartilhada');
  }
}

// PUT - Atualizar transação compartilhada
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updates,
      include: {
        account: true
      }
    });

    return NextResponse.json({
      transaction,
      message: 'Transação compartilhada atualizada com sucesso'
    });

  } catch (error) {
    return handleApiError(error, 'Erro ao atualizar transação compartilhada');
  }
}

// DELETE - Excluir transação compartilhada
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a transação para obter informações antes de excluir
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        sharedExpenses: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Excluir registros de SharedExpense relacionados
    await prisma.sharedExpense.deleteMany({
      where: { transactionId: id }
    });

    // Excluir a transação
    await prisma.transaction.delete({
      where: { id }
    });

    // Reverter o saldo da conta
    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: {
          increment: transaction.amount
        }
      }
    });

    return NextResponse.json({
      message: 'Transação compartilhada excluída com sucesso'
    });

  } catch (error) {
    return handleApiError(error, 'Erro ao excluir transação compartilhada');
  }
}
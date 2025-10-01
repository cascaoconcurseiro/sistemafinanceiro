import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Schema de validação para cartão de crédito
const CreditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.number().positive('Limite deve ser positivo'),
  currentBalance: z.number().default(0),
  dueDay: z.number().min(1).max(31, 'Dia de vencimento deve estar entre 1 e 31'),
  closingDay: z.number().min(1).max(31, 'Dia de fechamento deve estar entre 1 e 31'),
  isActive: z.boolean().default(true)
});

// GET - Listar cartões de crédito com dados calculados das transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');
    
    const skip = (page - 1) * limit;

    // Filtros
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Buscar cartões de crédito
    const [creditCards, total] = await Promise.all([
      prisma.creditCard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.creditCard.count({ where })
    ]);

    // Para cada cartão, calcular dados baseados nas transactions
    const creditCardsWithCalculatedData = await Promise.all(
      creditCards.map(async (card) => {
        // Buscar todas as transações do cartão
        const transactions = await prisma.transaction.findMany({
          where: {
            creditCardId: card.id,
            deletedAt: null
          },
          orderBy: { date: 'desc' }
        });

        // Calcular saldo atual baseado nas transações
        const currentBalance = transactions.reduce((sum, transaction) => {
          if (transaction.type === 'expense') {
            return sum + Number(transaction.amount);
          } else if (transaction.type === 'income') {
            // Pagamentos reduzem o saldo devedor
            return sum - Number(transaction.amount);
          }
          return sum;
        }, 0);

        // Calcular limite disponível
        const availableLimit = Number(card.limit) - currentBalance;

        // Calcular estatísticas do mês atual
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const monthlyTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
        });

        const monthlySpent = monthlyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyPayments = monthlyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Próxima data de vencimento
        const nextDueDate = new Date();
        nextDueDate.setDate(card.dueDay);
        if (nextDueDate <= currentDate) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        return {
          ...card,
          currentBalance: Number(currentBalance.toFixed(2)),
          availableLimit: Number(availableLimit.toFixed(2)),
          monthlySpent: Number(monthlySpent.toFixed(2)),
          monthlyPayments: Number(monthlyPayments.toFixed(2)),
          nextDueDate: nextDueDate.toISOString(),
          transactionCount: transactions.length,
          limit: Number(card.limit),
          utilizationPercentage: Number(((currentBalance / Number(card.limit)) * 100).toFixed(2))
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        creditCards: creditCardsWithCalculatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar cartões de crédito:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cartão de crédito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = CreditCardSchema.parse(body);

    // Criar cartão de crédito
    const creditCard = await prisma.creditCard.create({
      data: {
        name: validatedData.name,
        limit: validatedData.limit,
        currentBalance: validatedData.currentBalance,
        dueDay: validatedData.dueDay,
        closingDay: validatedData.closingDay,
        isActive: validatedData.isActive
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...creditCard,
        limit: Number(creditCard.limit),
        currentBalance: Number(creditCard.currentBalance)
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar cartão de crédito:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cartão de crédito
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cartão é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o cartão existe
    const existingCard = await prisma.creditCard.findUnique({
      where: { id }
    });

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }

    // Validar dados de atualização (parcial)
    const validatedData = CreditCardSchema.partial().parse(updateData);

    // Atualizar cartão
    const updatedCard = await prisma.creditCard.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCard,
        limit: Number(updatedCard.limit),
        currentBalance: Number(updatedCard.currentBalance)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar cartão de crédito:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cartão de crédito
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cartão é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o cartão existe
    const existingCard = await prisma.creditCard.findUnique({
      where: { id }
    });

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: 'Cartão de crédito não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há transações vinculadas
    const linkedTransactions = await prisma.transaction.count({
      where: {
        creditCardId: id,
        deletedAt: null
      }
    });

    if (linkedTransactions > 0) {
      // Soft delete - apenas desativar o cartão
      const deactivatedCard = await prisma.creditCard.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Cartão desativado com sucesso (possui transações vinculadas)',
        data: {
          ...deactivatedCard,
          limit: Number(deactivatedCard.limit),
          currentBalance: Number(deactivatedCard.currentBalance)
        }
      });
    } else {
      // Hard delete - remover completamente
      await prisma.creditCard.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Cartão de crédito excluído com sucesso'
      });
    }

  } catch (error) {
    console.error('Erro ao excluir cartão de crédito:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
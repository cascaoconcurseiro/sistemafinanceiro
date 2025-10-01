import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para validação de investment
const InvestmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  symbol: z.string().optional(),
  type: z.enum(['stock', 'bond', 'fund', 'crypto', 'real_estate', 'other']),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  purchasePrice: z.number().positive('Preço de compra deve ser positivo'),
  currentPrice: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  broker: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'sold', 'paused']).default('active')
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Buscar investimentos
    const investments = await prisma.investment.findMany({
      where: {
        ...(type && { type }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { symbol: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Para cada investimento, buscar transactions relacionadas
    const investmentsWithTransactions = await Promise.all(
      investments.map(async (investment) => {
        // Buscar todas as transactions do investimento
        const transactions = await prisma.transaction.findMany({
          where: { investmentId: investment.id },
          orderBy: { date: 'desc' }
        });

        // Calcular valores baseados nas transactions
        const totalInvested = transactions
          .filter(t => t.type === 'investment')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const totalWithdrawn = transactions
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Valor atual baseado no preço atual ou último preço
        const currentPrice = investment.currentPrice || investment.purchasePrice;
        const currentValue = investment.quantity * currentPrice;

        // Ganho/Perda
        const gainLoss = currentValue - totalInvested + totalWithdrawn;
        const gainLossPercentage = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

        return {
          ...investment,
          totalInvested,
          totalWithdrawn,
          currentValue,
          gainLoss,
          gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
          transactionCount: transactions.length,
          lastTransactionDate: transactions[0]?.date || null
        };
      })
    );

    // Calcular métricas do portfólio
    const totalValue = investmentsWithTransactions.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalInvested = investmentsWithTransactions.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const totalGainLoss = investmentsWithTransactions.reduce((sum, inv) => sum + inv.gainLoss, 0);

    const portfolio = {
      totalValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage: totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0,
      totalInvestments: investmentsWithTransactions.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        investments: investmentsWithTransactions,
        portfolio,
        pagination: {
          page,
          limit,
          total: investmentsWithTransactions.length,
          totalPages: Math.ceil(investmentsWithTransactions.length / limit),
        }
      }
    });
  } catch (error) {
    console.error('Erro na API de investimentos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = InvestmentSchema.parse(body);

    // Iniciar transação do banco
    const result = await prisma.$transaction(async (tx) => {
      // Criar investimento
      const investment = await tx.investment.create({
        data: {
          ...validatedData,
          purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : new Date(),
          currentPrice: validatedData.currentPrice || validatedData.purchasePrice
        }
      });

      // Criar transaction de investimento inicial
      const totalAmount = validatedData.quantity * validatedData.purchasePrice;
      
      await tx.transaction.create({
        data: {
          amount: -totalAmount, // Negativo porque é saída de dinheiro
          description: `Investimento inicial em ${validatedData.name}`,
          date: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : new Date(),
          type: 'investment',
          category: 'investimentos',
          investmentId: investment.id,
          // accountId pode ser adicionado se necessário
        }
      });

      return investment;
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro ao criar investimento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do investimento é obrigatório',
        },
        { status: 400 }
      );
    }

    // Verificar se investimento existe
    const existingInvestment = await prisma.investment.findUnique({
      where: { id }
    });

    if (!existingInvestment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investimento não encontrado'
        },
        { status: 404 }
      );
    }

    // Atualizar investimento
    const investment = await prisma.investment.update({
      where: { id },
      data: {
        ...updateData,
        purchaseDate: updateData.purchaseDate ? new Date(updateData.purchaseDate) : undefined,
        updatedAt: new Date()
      }
    });

    // Se o preço atual foi atualizado, criar uma transaction de ajuste
    if (updateData.currentPrice && updateData.currentPrice !== existingInvestment.currentPrice) {
      const oldValue = existingInvestment.quantity * (existingInvestment.currentPrice || existingInvestment.purchasePrice);
      const newValue = existingInvestment.quantity * updateData.currentPrice;
      const difference = newValue - oldValue;

      if (Math.abs(difference) > 0.01) { // Apenas se a diferença for significativa
        await prisma.transaction.create({
          data: {
            amount: difference,
            description: `Ajuste de valor - ${existingInvestment.name}`,
            date: new Date(),
            type: difference > 0 ? 'income' : 'expense',
            category: 'ajustes_investimento',
            investmentId: id,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: investment,
    });

  } catch (error) {
    console.error('Erro ao atualizar investimento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID do investimento é obrigatório',
        },
        { status: 400 }
      );
    }

    // Verificar se investimento existe
    const existingInvestment = await prisma.investment.findUnique({
      where: { id }
    });

    if (!existingInvestment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investimento não encontrado'
        },
        { status: 404 }
      );
    }

    // Verificar se há transactions vinculadas
    const linkedTransactions = await prisma.transaction.count({
      where: { investmentId: id }
    });

    if (linkedTransactions > 0) {
      // Soft delete - apenas desativar
      await prisma.investment.update({
        where: { id },
        data: { 
          status: 'sold',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Investimento marcado como vendido (há transações vinculadas)'
      });
    } else {
      // Hard delete - remover completamente
      await prisma.investment.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'Investimento removido com sucesso'
      });
    }

  } catch (error) {
    console.error('Erro ao deletar investimento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
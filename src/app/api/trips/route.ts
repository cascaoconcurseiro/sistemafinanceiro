import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Schema de validação para Trip
const TripSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  destination: z.string().min(1, 'Destino é obrigatório'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budget: z.number().min(0).default(0),
  currency: z.string().default('BRL'),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  participants: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const destination = searchParams.get('destination');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause: any = {};

    if (status) whereClause.status = status;
    if (destination) whereClause.destination = { contains: destination, mode: 'insensitive' };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: whereClause,
        include: {
          transactions: {
            where: {
              deletedAt: null
            },
            select: {
              id: true,
              amount: true,
              description: true,
              category: true,
              type: true,
              date: true,
              status: true
            }
          },
          _count: {
            select: {
              transactions: {
                where: {
                  deletedAt: null
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.trip.count({ where: whereClause })
    ]);

    // Calcular estatísticas baseadas nas transações
    const tripsWithStats = trips.map(trip => {
      const expenses = trip.transactions.filter(t => t.type === 'expense');
      const totalSpent = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const remainingBudget = Number(trip.budget) - totalSpent;
      const budgetUtilization = Number(trip.budget) > 0 ? (totalSpent / Number(trip.budget)) * 100 : 0;

      return {
        ...trip,
        totalSpent,
        remainingBudget,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        expenseCount: expenses.length,
        transactions: trip.transactions
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        trips: tripsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação com Zod
    const validatedData = TripSchema.parse(body);

    const trip = await prisma.trip.create({
      data: {
        name: validatedData.name,
        destination: validatedData.destination,
        description: validatedData.description || null,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        budget: validatedData.budget,
        currency: validatedData.currency,
        status: validatedData.status,
        participants: validatedData.participants ? JSON.stringify(validatedData.participants) : null,
      },
      include: {
        transactions: {
          where: {
            deletedAt: null
          }
        },
        _count: {
          select: {
            transactions: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: trip
    }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao criar viagem:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    // Validação parcial com Zod
    const PartialTripSchema = TripSchema.partial();
    const validatedData = PartialTripSchema.parse(updateData);

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        participants: validatedData.participants ? JSON.stringify(validatedData.participants) : undefined,
        updatedAt: new Date()
      },
      include: {
        transactions: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            amount: true,
            description: true,
            category: true,
            type: true,
            date: true,
            status: true
          }
        },
        _count: {
          select: {
            transactions: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    // Calcular estatísticas
    const expenses = trip.transactions.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const remainingBudget = Number(trip.budget) - totalSpent;
    const budgetUtilization = Number(trip.budget) > 0 ? (totalSpent / Number(trip.budget)) * 100 : 0;

    const tripWithStats = {
      ...trip,
      totalSpent,
      remainingBudget,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      expenseCount: expenses.length
    };

    return NextResponse.json({
      success: true,
      data: tripWithStats
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar viagem:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se existem transações associadas
    const transactionCount = await prisma.transaction.count({
      where: { 
        tripId: id,
        deletedAt: null
      }
    });

    if (transactionCount > 0) {
      // Soft delete - apenas marcar como inativo ou mover transações
      // Por enquanto, vamos impedir a exclusão se houver transações
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir viagem com transações associadas. Exclua as transações primeiro.' 
        },
        { status: 400 }
      );
    }

    // Hard delete se não houver transações
    await prisma.trip.delete({
      where: { id }
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Viagem excluída com sucesso' 
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao excluir viagem:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

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
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().min(0).default(0),
  spent: z.number().min(0).default(0).optional(),
  currency: z.string().default('BRL'),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  participants: z.array(z.string()).optional(),
});


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }
    const userId = auth.userId!;
    console.log('👤 [API Trips GET] UserId autenticado:', userId);

    // Buscar viagens do usuário com tratamento de erro
    let trips = [];
    try {
      console.log('🔍 [API Trips GET] Buscando viagens para userId:', userId);
      trips = await prisma.trip.findMany({
        where: {
          userId
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
              categoryId: true,
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
        orderBy: { createdAt: 'desc' }
      });
      console.log('✅ [API Trips GET] Viagens encontradas:', trips.length);
      console.log('📋 [API Trips GET] Viagens:', trips.map(t => ({ 
        id: t.id, 
        name: t.name, 
        userId: t.userId,
        startDate: t.startDate,
        endDate: t.endDate 
      })));
    } catch (error) {
      console.log('❌ [API Trips GET] Erro na consulta:', error);
      // Retornar dados vazios se a tabela não existir
      trips = [];
    }

    // Calcular estatísticas e atualizar status automaticamente
    const tripsWithStats = trips.map(trip => {
      const expenses = trip.transactions.filter(t => t.type === 'expense');
      const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const remainingBudget = Number(trip.budget) - totalSpent;
      const budgetUtilization = Number(trip.budget) > 0 ? (totalSpent / Number(trip.budget)) * 100 : 0;

      // Calcular status baseado nas datas
      const now = new Date();
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      
      let calculatedStatus = trip.status;
      
      // Atualizar status automaticamente baseado nas datas
      if (now < startDate) {
        calculatedStatus = 'planned'; // Ainda não começou
      } else if (now >= startDate && now <= endDate) {
        calculatedStatus = 'active'; // Em andamento
      } else if (now > endDate) {
        calculatedStatus = 'completed'; // Já terminou
      }

      return {
        ...trip,
        status: calculatedStatus, // Usar status calculado
        totalSpent,
        remainingBudget,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        expenseCount: expenses.length
      };
    });

    // Calcular estatísticas gerais usando status calculado
    const totalBudget = trips.reduce((sum, trip) => sum + Number(trip.budget), 0);
    const totalSpent = tripsWithStats.reduce((sum, trip) => sum + trip.totalSpent, 0);
    const activeTrips = tripsWithStats.filter(trip => trip.status === 'active').length;
    const plannedTrips = tripsWithStats.filter(trip => trip.status === 'planned').length;
    const completedTrips = tripsWithStats.filter(trip => trip.status === 'completed').length;

    return NextResponse.json({
      success: true,
      data: {
        trips: tripsWithStats,
        pagination: {
          page: 1,
          limit: 10,
          total: trips.length,
          totalPages: Math.ceil(trips.length / 10)
        },
        stats: {
          totalBudget,
          totalSpent,
          activeTrips,
          plannedTrips,
          completedTrips
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
    // Autenticação obrigatória
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      );
    }
    const userId = auth.userId!;
    console.log('👤 [API Trips POST] UserId autenticado:', userId);

    const body = await request.json();
    console.log('🔍 [API Trips POST] Dados recebidos:', body);
    console.log('👤 [API Trips POST] Criando viagem para userId:', userId);
    
    // Validação com Zod
    try {
      const validatedData = TripSchema.parse(body);
      console.log('✅ [API Trips] Dados validados:', validatedData);
    } catch (validationError) {
      console.error('❌ [API Trips] Erro de validação:', validationError);
      throw validationError;
    }

    const validatedData = TripSchema.parse(body);
    
    console.log('💾 [API Trips POST] Criando viagem com userId:', userId);
    
    const trip = await prisma.trip.create({
      data: {
        userId,
        name: validatedData.name,
        destination: validatedData.destination,
        description: validatedData.description || null,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        budget: validatedData.budget,
        spent: validatedData.spent || 0,
        currency: validatedData.currency,
        status: validatedData.status,
        participants: validatedData.participants ? JSON.stringify(validatedData.participants) : null,
      }
    });

    console.log('✅ [API Trips POST] Viagem criada:', { id: trip.id, name: trip.name, userId: trip.userId });

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
            categoryId: true,
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

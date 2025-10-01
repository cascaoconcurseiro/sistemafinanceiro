import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalNotificationService } from '@/lib/notifications/goal-notifications';
import { z } from 'zod';

const GoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  targetAmount: z.number().positive('Valor meta deve ser positivo'),
  targetDate: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause: any = {};

    if (status) whereClause.status = status;
    if (category) whereClause.category = category;

    const goals = await prisma.goal.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate current amount based on transactions for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        // Sum all transactions linked to this goal
        const transactionSum = await prisma.transaction.aggregate({
          where: {
            goalId: goal.id,
            type: 'income' // Only count income transactions towards goal progress
          },
          _sum: {
            amount: true
          }
        });

        const currentAmount = transactionSum._sum.amount || 0;
        const progressPercentage = goal.target > 0 ? (Number(currentAmount) / Number(goal.target)) * 100 : 0;

        return {
          ...goal,
          currentAmount: Number(currentAmount),
          progressPercentage: Math.min(progressPercentage, 100), // Cap at 100%
          isCompleted: progressPercentage >= 100,
          target: Number(goal.target),
          current: Number(currentAmount) // For backward compatibility
        };
      })
    );

    const totalCount = await prisma.goal.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
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
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
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
    
    // Validate input data
    const validatedData = GoalSchema.parse({
      ...body,
      targetAmount: parseFloat(body.targetAmount)
    });
    
    // Use Prisma transaction to create goal and initial transaction if needed
    const result = await prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          id: validatedData.id || `goal_${Date.now()}`,
          name: validatedData.name,
          description: validatedData.description || null,
          target: validatedData.targetAmount,
          targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
          category: validatedData.category || 'other',
          status: validatedData.status || 'active',
          priority: validatedData.priority || 'medium',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // If there's an initial amount, create a transaction
      if (body.currentAmount && parseFloat(body.currentAmount) > 0) {
        await tx.transaction.create({
          data: {
            id: `goal_initial_${goal.id}_${Date.now()}`,
            amount: parseFloat(body.currentAmount),
            description: `Valor inicial para meta: ${goal.name}`,
            type: 'income',
            category: 'goal_contribution',
            goalId: goal.id,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      return goal;
    });

    return NextResponse.json({
      success: true,
      data: result
    }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    
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
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
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
        { 
          success: false,
          error: 'ID da meta é obrigatório' 
        },
        { status: 400 }
      );
    }

    // Get the current goal to compare amounts
    const currentGoal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!currentGoal) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Meta não encontrada' 
        },
        { status: 404 }
      );
    }

    // Use Prisma transaction to update goal and create transaction if amount changed
    const result = await prisma.$transaction(async (tx) => {
      const goal = await tx.goal.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          target: updateData.targetAmount ? parseFloat(updateData.targetAmount) : updateData.target ? parseFloat(updateData.target) : undefined,
          targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
          priority: updateData.priority,
          status: updateData.status,
          updatedAt: new Date()
        }
      });

      // If currentAmount is being updated, create a transaction for the difference
      if (updateData.currentAmount !== undefined) {
        // Get current amount from transactions
        const currentTransactionSum = await tx.transaction.aggregate({
          where: {
            goalId: id,
            type: 'income'
          },
          _sum: {
            amount: true
          }
        });

        const currentAmountFromTransactions = Number(currentTransactionSum._sum.amount || 0);
        const newAmount = parseFloat(updateData.currentAmount);
        const difference = newAmount - currentAmountFromTransactions;

        if (Math.abs(difference) > 0.01) { // Only create transaction if difference is significant
          await tx.transaction.create({
            data: {
              id: `goal_adjustment_${id}_${Date.now()}`,
              amount: Math.abs(difference),
              description: difference > 0 
                ? `Contribuição para meta: ${goal.name}` 
                : `Ajuste na meta: ${goal.name}`,
              type: difference > 0 ? 'income' : 'expense',
              category: 'goal_contribution',
              goalId: id,
              date: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }

        // Check for goal completion and milestone notifications
        await GoalNotificationService.checkGoalCompletion(id, currentAmountFromTransactions, newAmount);
      }

      return goal;
    });

    return NextResponse.json({
      success: true,
      data: result
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
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
        { 
          success: false,
          error: 'ID da meta é obrigatório' 
        },
        { status: 400 }
      );
    }

    // Check if there are transactions linked to this goal
    const linkedTransactions = await prisma.transaction.count({
      where: { goalId: id }
    });

    if (linkedTransactions > 0) {
      // Soft delete: just mark as inactive/deleted
      await prisma.goal.update({
        where: { id },
        data: {
          status: 'deleted',
          updatedAt: new Date()
        }
      });

      return NextResponse.json(
        { 
          success: true,
          message: 'Meta marcada como excluída (possui transações vinculadas)',
          data: { softDelete: true }
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    } else {
      // Hard delete: no transactions linked
      await prisma.goal.delete({
        where: { id }
      });

      return NextResponse.json(
        { 
          success: true,
          message: 'Meta excluída com sucesso',
          data: { softDelete: false }
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
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

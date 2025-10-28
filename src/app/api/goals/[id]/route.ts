import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

const UpdateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export const dynamic = 'force-dynamic';

// GET - Buscar meta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: auth.userId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      goal: {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar meta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar meta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateGoalSchema.parse(body);

    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: auth.userId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.targetAmount !== undefined) updateData.targetAmount = validatedData.targetAmount;
    if (validatedData.currentAmount !== undefined) updateData.currentAmount = validatedData.currentAmount;
    if (validatedData.deadline !== undefined) {
      updateData.deadline = validatedData.deadline ? new Date(validatedData.deadline) : null;
    }
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;

    const updatedGoal = await prisma.goal.update({
      where: { id: params.id },
      data: updateData,
    });

    console.log('✅ Meta atualizada:', updatedGoal.id, updatedGoal.name);

    return NextResponse.json({
      success: true,
      goal: {
        ...updatedGoal,
        targetAmount: Number(updatedGoal.targetAmount),
        currentAmount: Number(updatedGoal.currentAmount),
      },
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar meta:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Deletar meta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: auth.userId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    // Deletar meta
    await prisma.goal.delete({
      where: { id: params.id },
    });

    console.log('✅ Meta deletada:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Meta deletada com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao deletar meta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
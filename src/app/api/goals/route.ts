import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

const GoalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  targetAmount: z.number().positive('Valor meta deve ser positivo'),
  currentAmount: z.number().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId!;

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      goals: goals.map(g => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount)
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Usar helper de autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId!;

    const body = await request.json();
    const validatedData = GoalSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        userId,
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount || 0,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        status: validatedData.status || 'active',
        priority: validatedData.priority
      }
    });

    console.log('✅ Meta criada:', goal.id, goal.name);

    return NextResponse.json({
      success: true,
      goal: {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount)
      }
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar meta:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

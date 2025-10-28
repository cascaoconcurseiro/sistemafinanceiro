import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

export const dynamic = 'force-dynamic';

// GET - Listar lembretes do usuário
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = { userId: auth.userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Erro ao buscar lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembretes' },
      { status: 500 }
    );
  }
}

// POST - Criar novo lembrete
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    const dueDate = new Date(body.dueDate);
    const now = new Date();
    
    const reminder = await prisma.reminder.create({
      data: {
        userId: auth.userId,
        title: body.title,
        description: body.description,
        dueDate,
        category: body.category || 'general',
        priority: body.priority || 'medium',
        status: body.status || 'pending',
        recurring: body.recurring || false,
        frequency: body.frequency,
        amount: body.amount,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null
      }
    });

    // Criar notificação se:
    // 1. O lembrete for de alta prioridade OU
    // 2. A data de vencimento for hoje ou já passou
    const shouldNotify = body.priority === 'high' || dueDate <= now;
    
    if (shouldNotify) {
      await prisma.notification.create({
        data: {
          userId: auth.userId,
          title: dueDate <= now ? `Lembrete: ${body.title}` : `Novo lembrete: ${body.title}`,
          message: body.description || (dueDate <= now ? 'Você tem um lembrete pendente' : 'Lembrete criado com sucesso'),
          type: 'reminder',
          priority: body.priority || 'medium',
          isRead: false,
          metadata: JSON.stringify({ reminderId: reminder.id })
        }
      });
      
      console.log(`✅ [Reminders] Notificação criada para: ${body.title}`);
    }

    return NextResponse.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lembrete' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar lembrete
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    // Verificar se o lembrete pertence ao usuário
    const existing = await prisma.reminder.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'Lembrete não encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.category) updateData.category = data.category;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.recurring !== undefined) updateData.recurring = data.recurring;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.metadata) updateData.metadata = JSON.stringify(data.metadata);

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData
    });

    // Se foi marcado como concluído, criar notificação
    if (data.status === 'completed' && existing.status !== 'completed') {
      await prisma.notification.create({
        data: {
          userId: auth.userId,
          title: `Lembrete concluído: ${reminder.title}`,
          message: 'Parabéns por completar este lembrete!',
          type: 'success',
          isRead: false
        }
      });
    }

    return NextResponse.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Erro ao atualizar lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lembrete' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir lembrete
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // Verificar se o lembrete pertence ao usuário
    const existing = await prisma.reminder.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'Lembrete não encontrado' }, { status: 404 });
    }

    await prisma.reminder.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Lembrete excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir lembrete' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Buscar todas as notificações
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, duration, isRead, metadata } = body;

    const newNotification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        duration,
        isRead: isRead || false,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    return NextResponse.json({ notification: newNotification });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar todas as notificações
export async function DELETE() {
  try {
    await prisma.notification.deleteMany({});

    return NextResponse.json({ message: 'Notificações limpas com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
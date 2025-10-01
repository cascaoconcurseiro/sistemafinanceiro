import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Marcar notificação como lida
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isRead } = body;

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead }
    });

    return NextResponse.json({ 
      message: 'Notificação atualizada com sucesso',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover notificação específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Notificação removida com sucesso',
      id 
    });
  } catch (error) {
    console.error('Erro ao remover notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
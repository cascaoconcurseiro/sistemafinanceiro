import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Marcar todas as notificações como lidas
export async function PATCH() {
  try {
    await prisma.notification.updateMany({
      data: { isRead: true }
    });

    return NextResponse.json({ 
      message: 'Todas as notificações foram marcadas como lidas' 
    });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
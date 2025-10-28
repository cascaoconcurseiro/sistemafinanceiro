import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);
    
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Marcar todas as notificações do usuário como lidas
    await prisma.notification.updateMany({
      where: {
        userId: auth.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    console.log(`✅ Todas as notificações marcadas como lidas para usuário: ${auth.userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

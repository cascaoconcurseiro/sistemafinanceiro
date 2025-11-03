import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Extrair o ID real da notificação (remover prefixo se houver)
    const notificationId = params.id.replace(/^(saved-|reminder-|bill-|overdue-|card-due-|goal-|achieved-|budget-)/, '');

    // Tentar marcar como lida no banco
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: auth.userId,
        },
        data: {
          isRead: true,
        },
      });
    } catch (error) {
      // Se não existir no banco, apenas retornar sucesso (notificação temporária)
      console.log('Notificação temporária marcada como lida:', params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

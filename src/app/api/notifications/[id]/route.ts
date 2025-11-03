import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Extrair o ID real da notificação
    const notificationId = params.id.replace(/^(saved-|reminder-|bill-|overdue-|card-due-|goal-|achieved-|budget-)/, '');

    // Tentar deletar do banco
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: auth.userId,
        },
      });
    } catch (error) {
      // Se não existir no banco, apenas retornar sucesso
      console.log('Notificação temporária deletada:', params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

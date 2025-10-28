import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// PATCH - Marcar todas as notificações como lidas
export async function PATCH(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ✅ CORREÇÃO CRÍTICA: Marcar apenas notificações do usuário autenticado
    await prisma.notification.updateMany({
      where: {
        userId: auth.userId // ✅ Isolamento de dados
      },
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

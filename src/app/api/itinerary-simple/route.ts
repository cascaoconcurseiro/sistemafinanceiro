import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';


export async function PUT(request: NextRequest) {
  console.log('🧪 [Simple API] PUT iniciado');

  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Ler body
    const body = await request.json();
    console.log('📥 [Simple API] Body:', body);

    // 2. Importar Prisma dinamicamente
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // 3. Conectar
    await prisma.$connect();
    
    // 4. Buscar item e verificar se pertence ao usuário
    const item = await prisma.itinerary.findFirst({
      where: { id: body.id },
      include: {
        trip: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!item || item.trip?.userId !== auth.userId) {
      await prisma.$disconnect();
      return NextResponse.json({ error: 'Item não encontrado ou não pertence ao usuário' }, { status: 403 });
    }

    
    // 5. Atualizar
    const updated = await prisma.itinerary.update({
      where: { id: body.id },
      data: {
        completed: body.completed,
        completedAt: body.completed ? new Date() : null
      }
    });

    
    // 6. Desconectar
    await prisma.$disconnect();

    return NextResponse.json(updated);

  } catch (error) {
    console.error('❌ [Simple API] Erro:', error);
    return NextResponse.json({
      error: 'Erro interno',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

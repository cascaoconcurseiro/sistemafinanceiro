import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { z } from 'zod';

// Schema de validação para criação de família
const createFamilySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional().nullable(),
});

/**
 * GET /api/family
 * Busca a família do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    
    // Buscar família do usuário
    // Nota: Assumindo que o usuário pode ter apenas uma família
    // Se o modelo permitir múltiplas famílias, ajustar a query
    const family = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        familyMembers: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retornar dados da "família" (usuário + membros)
    const familyData = {
      id: family.id,
      name: `Família ${family.name}`,
      owner: {
        id: family.id,
        name: family.name,
        email: family.email,
      },
      members: family.familyMembers,
      totalMembers: family.familyMembers.length,
    };

    console.log('✅ [API Family] Família encontrada:', {
      id: familyData.id,
      members: familyData.totalMembers,
    });

    return NextResponse.json(familyData);
  } catch (error) {
    console.error('❌ [API Family] Erro ao buscar família:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar família' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family
 * Cria uma nova família (atualiza informações do usuário)
 * Nota: No modelo atual, cada usuário representa sua própria família
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API Family] Dados recebidos:', body);

    // Validar dados
    try {
      createFamilySchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
                return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Atualizar informações do usuário (que representa a família)
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        name: body.name,
        // Adicionar outros campos se necessário
      },
      select: {
        id: true,
        name: true,
        email: true,
        familyMembers: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    const familyData = {
      id: updatedUser.id,
      name: `Família ${updatedUser.name}`,
      owner: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
      members: updatedUser.familyMembers,
      totalMembers: updatedUser.familyMembers.length,
    };

    
    return NextResponse.json(familyData, { status: 201 });
  } catch (error) {
    console.error('❌ [API Family] Erro ao criar família:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar família' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/family
 * Atualiza informações da família
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 [API Family] Atualizando família:', body);

    // Validar dados
    try {
      createFamilySchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Dados inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        name: body.name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        familyMembers: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    const familyData = {
      id: updatedUser.id,
      name: `Família ${updatedUser.name}`,
      owner: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
      members: updatedUser.familyMembers,
      totalMembers: updatedUser.familyMembers.length,
    };

    
    return NextResponse.json(familyData);
  } catch (error) {
    console.error('❌ [API Family] Erro ao atualizar família:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar família' },
      { status: 500 }
    );
  }
}

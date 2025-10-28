import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// Singleton mais robusto
declare global {
  var __prisma: PrismaClient | undefined;
}

function getPrismaClient() {
  if (!global.__prisma) {
    console.log('🔧 [Itinerary API] Criando cliente Prisma...');
    global.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return global.__prisma;
}


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');
    const date = searchParams.get('date');

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const prismaClient = getPrismaClient();
    const trip = await prismaClient.trip.findFirst({
      where: {
        id: tripId,
        userId: auth.userId
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    let whereClause: any = { tripId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const itinerary = await prismaClient.itinerary.findMany({
      where: whereClause,
      orderBy: [
        { date: 'asc' },
        { order: 'asc' },
        { time: 'asc' }
      ]
    });

    return NextResponse.json(itinerary, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar itinerário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('📥 [Itinerary API] Recebendo POST:', body);
    
    // Validação dos campos obrigatórios
    if (!body.tripId || !body.date || !body.title || !body.type) {
      console.error('❌ [Itinerary API] Campos obrigatórios faltando:', {
        tripId: !!body.tripId,
        date: !!body.date,
        title: !!body.title,
        type: !!body.type
      });
      return NextResponse.json(
        { error: 'Campos obrigatórios: tripId, date, title, type', received: body },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const prismaClient = getPrismaClient();
    const trip = await prismaClient.trip.findFirst({
      where: {
        id: body.tripId,
        userId: auth.userId
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }
    
    // Location pode ser vazio, mas não pode ser undefined
    if (body.location === undefined || body.location === null || body.location === '') {
      body.location = 'A definir';
    }
    
    // Preparar dados com validação
    const itemData = {
      tripId: String(body.tripId),
      date: new Date(body.date),
      time: body.time || null,
      title: String(body.title),
      description: String(body.description || ''),
      location: String(body.location),
      type: String(body.type),
      duration: body.duration ? Number(body.duration) : null,
      cost: body.cost ? Number(body.cost) : 0,
      notes: body.notes ? String(body.notes) : null,
      order: body.order ? Number(body.order) : 0,
      completed: Boolean(body.completed || false),
      completedAt: body.completed ? new Date() : null,
    };
    
    console.log('📝 [Itinerary API] Dados preparados para criação:', itemData);
    
    const itineraryItem = await prismaClient.itinerary.create({
      data: itemData
    });

    return NextResponse.json(itineraryItem, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao criar item do itinerário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('🚀 [Itinerary API] PUT iniciado');
  
  let body: any;
  let prismaClient: PrismaClient;
  
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Ler body
    console.log('📖 [Itinerary API] Lendo body da requisição...');
    try {
      body = await request.json();
      console.log('📥 [Itinerary API] Body recebido:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error('❌ [Itinerary API] Erro ao ler JSON:', jsonError);
      return NextResponse.json(
        { error: 'JSON inválido', details: jsonError instanceof Error ? jsonError.message : 'Erro desconhecido' },
        { status: 400 }
      );
    }

    // 2. Validar ID
    if (!body || !body.id) {
      console.error('❌ [Itinerary API] ID não fornecido:', body);
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }

    // 3. Obter cliente Prisma
    console.log('🔧 [Itinerary API] Obtendo cliente Prisma...');
    try {
      prismaClient = getPrismaClient();
      console.log('✅ [Itinerary API] Cliente Prisma obtido');
    } catch (prismaError) {
      console.error('❌ [Itinerary API] Erro ao obter cliente Prisma:', prismaError);
      return NextResponse.json(
        { error: 'Erro de conexão com banco de dados', details: prismaError instanceof Error ? prismaError.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
    // 4. Verificar se item existe e pertence ao usuário
    console.log('🔍 [Itinerary API] Verificando se item existe...');
    let existingItem;
    try {
      existingItem = await prismaClient.itinerary.findFirst({
        where: { 
          id: body.id 
        },
        include: {
          trip: {
            select: {
              userId: true
            }
          }
        }
      });
      console.log('📋 [Itinerary API] Item encontrado:', existingItem ? 'Sim' : 'Não');
    } catch (findError) {
      console.error('❌ [Itinerary API] Erro ao buscar item:', findError);
      return NextResponse.json(
        { error: 'Erro ao buscar item no banco', details: findError instanceof Error ? findError.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }

    if (!existingItem || existingItem.trip?.userId !== auth.userId) {
      console.error('❌ [Itinerary API] Item não encontrado ou não pertence ao usuário:', body.id);
      return NextResponse.json(
        { error: 'Item não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    // 5. Preparar dados de atualização
    console.log('🔧 [Itinerary API] Preparando dados de atualização...');
    const updateData: any = {};
    
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
      console.log('🔄 [Itinerary API] Atualizando completed:', {
        itemId: body.id,
        oldCompleted: existingItem.completed,
        newCompleted: body.completed
      });
    }

    // Adicionar outros campos apenas se fornecidos
    if (body.date) updateData.date = new Date(body.date);
    if (body.time !== undefined) updateData.time = body.time;
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location) updateData.location = body.location;
    if (body.type) updateData.type = body.type;
    if (body.duration !== undefined) updateData.duration = body.duration ? parseInt(body.duration) : null;
    if (body.cost !== undefined) updateData.cost = body.cost ? parseFloat(body.cost) : 0;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.order !== undefined) updateData.order = body.order;

    console.log('📝 [Itinerary API] Dados para atualização:', JSON.stringify(updateData, null, 2));

    // 6. Executar atualização
    console.log('💾 [Itinerary API] Executando atualização no banco...');
    let updatedItem;
    try {
      updatedItem = await prismaClient.itinerary.update({
        where: { id: body.id },
        data: updateData
      });
      console.log('✅ [Itinerary API] Item atualizado com sucesso:', {
        id: updatedItem.id,
        completed: updatedItem.completed,
        completedAt: updatedItem.completedAt
      });
    } catch (updateError) {
      console.error('❌ [Itinerary API] Erro ao atualizar item:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar item no banco', details: updateError instanceof Error ? updateError.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedItem, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ [Itinerary API] ERRO CRÍTICO:', error);
    console.error('❌ [Itinerary API] Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
    console.error('❌ [Itinerary API] Tipo do erro:', typeof error);
    console.error('❌ [Itinerary API] Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão' },
        { status: 400 }
      );
    }

    const prismaClient = getPrismaClient();
    
    // ✅ CORREÇÃO CRÍTICA: Verificar se o item pertence ao usuário
    const existingItem = await prismaClient.itinerary.findFirst({
      where: { id },
      include: {
        trip: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!existingItem || existingItem.trip?.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Item não encontrado ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    await prismaClient.itinerary.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Item do itinerário excluído com sucesso' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao excluir item do itinerário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

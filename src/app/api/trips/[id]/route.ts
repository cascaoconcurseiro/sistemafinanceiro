import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const tripData = await request.json();
    const { id } = params;

    console.log('📝 [PUT /api/trips/[id]] Dados recebidos:', {
      id,
      userId: auth.userId,
      tripData
    });

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    if (!existingTrip) {
      return NextResponse.json(
        { success: false, error: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Atualizar apenas se pertencer ao usuário
    const updateData: any = {
      name: tripData.name,
      destination: tripData.destination,
      status: tripData.status,
      budget: tripData.budget,
      currency: tripData.currency,
    };

    // Adicionar campos opcionais apenas se existirem
    if (tripData.startDate) updateData.startDate = new Date(tripData.startDate);
    if (tripData.endDate) updateData.endDate = new Date(tripData.endDate);
    if (tripData.description !== undefined) updateData.description = tripData.description;
    if (tripData.participants) updateData.participants = tripData.participants;
    if (tripData.spent !== undefined) updateData.spent = tripData.spent;

    console.log('💾 [PUT /api/trips/[id]] Atualizando com dados:', updateData);

    const trip = await prisma.trip.update({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Erro ao atualizar trip:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const { authenticateRequest } = await import('@/lib/utils/auth-helpers');
    const auth = await authenticateRequest(request);

    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    if (!existingTrip) {
      return NextResponse.json(
        { success: false, error: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Deletar apenas se pertencer ao usuário
    await prisma.trip.delete({
      where: {
        id,
        userId: auth.userId // ✅ Isolamento de dados
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Trip deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar trip:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

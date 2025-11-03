import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const trip = await prisma.trip.findFirst({
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

    const items = await prisma.shoppingItem.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar itens de compras:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.tripId || !data.name || !data.category) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tripId, name, category' },
        { status: 400 }
      );
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se a viagem pertence ao usuário
    const trip = await prisma.trip.findFirst({
      where: {
        id: data.tripId,
        userId: auth.userId
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Viagem não encontrada ou não pertence ao usuário' },
        { status: 403 }
      );
    }

    const item = await prisma.shoppingItem.create({
      data: {
        tripId: data.tripId,
        name: data.name,
        category: data.category,
        quantity: data.quantity || 1,
        estimatedPrice: data.estimatedPrice || 0,
        notes: data.notes || null
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item de compras:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o item pertence ao usuário
    const existingItem = await prisma.shoppingItem.findFirst({
      where: { id: data.id },
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

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.estimatedPrice !== undefined) updateData.estimatedPrice = data.estimatedPrice;
    if (data.actualPrice !== undefined) updateData.actualPrice = data.actualPrice;
    if (data.isPurchased !== undefined) updateData.isPurchased = data.isPurchased;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    if (data.purchaseLocation !== undefined) updateData.purchaseLocation = data.purchaseLocation;

    const item = await prisma.shoppingItem.update({
      where: { id: data.id },
      data: updateData
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Erro ao atualizar item de compras:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se o item pertence ao usuário
    const existingItem = await prisma.shoppingItem.findFirst({
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

    await prisma.shoppingItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir item de compras:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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

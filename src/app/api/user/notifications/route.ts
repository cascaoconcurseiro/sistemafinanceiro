import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

// GET - Buscar preferências de notificação
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preferências padrão se não existirem
    const defaultPreferences = {
      billing: true,
      goal: true,
      investments: true,
      general: true,
    };

    const preferences = user.notificationPreferences 
      ? (typeof user.notificationPreferences === 'string' 
          ? JSON.parse(user.notificationPreferences) 
          : user.notificationPreferences)
      : defaultPreferences;

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar preferências:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar preferências' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar preferências de notificação
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const preferences = await request.json();

    // Atualizar preferências no banco
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        notificationPreferences: JSON.stringify(preferences),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      preferences,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar preferências:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar preferências' },
      { status: 500 }
    );
  }
}

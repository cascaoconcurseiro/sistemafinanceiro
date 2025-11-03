import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key-dev-only';

// GET - Buscar configurações de aparência
export async function GET(request: NextRequest) {
  try {
    // Buscar token do cookie
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar token JWT
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        themeSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Configurações padrão
    const defaultSettings = {
      theme: 'system',
      accentColor: 'blue',
      fontSize: 'medium',
      compactMode: false,
      sidebarCollapsed: false,
      showAvatars: true,
      colorfulIcons: true,
      animations: true,
      reducedMotion: false,
      highContrast: false,
    };

    const settings = user.themeSettings 
      ? (typeof user.themeSettings === 'string' 
          ? JSON.parse(user.themeSettings) 
          : user.themeSettings)
      : defaultSettings;

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações de aparência
export async function PUT(request: NextRequest) {
  try {
    // Buscar token do cookie
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar token JWT
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
    };

    const settings = await request.json();

    // Atualizar configurações no banco
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        themeSettings: JSON.stringify(settings),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      settings,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}

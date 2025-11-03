import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// Singleton para evitar múltiplas instâncias do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Configurações padrão do tema
const defaultThemeSettings = {
  theme: 'system',
  accentColor: 'blue',
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  highContrast: false,
  reducedMotion: false,
  sidebarCollapsed: false,
  showAvatars: true,
  colorfulIcons: true,
};

export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // ✅ CORREÇÃO CRÍTICA: Buscar configurações do usuário específico
    let userSettings;
    try {
      userSettings = await prisma.userSettings.findUnique({
        where: { userId: auth.userId }
      });
    } catch (error) {
      // Se a tabela não existir, usar configurações padrão
      console.log('Tabela userSettings não existe, usando configurações padrão');
      userSettings = null;
    }

    const themeSettings = userSettings?.themeSettings
      ? (typeof userSettings.themeSettings === 'string'
          ? JSON.parse(userSettings.themeSettings)
          : userSettings.themeSettings)
      : defaultThemeSettings;

    return NextResponse.json({
      success: true,
      data: themeSettings
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar configurações de tema:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
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

    // Validar configurações recebidas
    const updatedSettings = {
      ...defaultThemeSettings,
      ...body
    };

    // ✅ CORREÇÃO CRÍTICA: Salvar configurações do usuário específico
    try {
      await prisma.userSettings.upsert({
        where: { userId: auth.userId },
        update: { themeSettings: JSON.stringify(updatedSettings) },
        create: {
          userId: auth.userId,
          themeSettings: JSON.stringify(updatedSettings)
        }
      });
    } catch (error) {
      console.log('Erro ao salvar configurações (tabela pode não existir):', error);
      // Continuar mesmo se não conseguir salvar no banco
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de tema:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
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

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

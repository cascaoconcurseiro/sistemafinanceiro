import { NextRequest, NextResponse } from 'next/server';

// Configurações padrão do tema
const defaultThemeSettings = {
  darkMode: false,
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  highContrast: false
};

export async function GET(request: NextRequest) {
  try {
    // Por enquanto retornamos configurações padrão
    // Futuramente pode ser integrado com banco de dados ou localStorage do usuário
    return NextResponse.json(defaultThemeSettings, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar configurações de tema:', error);
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
    const body = await request.json();
    
    // Validar configurações recebidas
    const updatedSettings = {
      ...defaultThemeSettings,
      ...body
    };

    // Por enquanto apenas retornamos as configurações atualizadas
    // Futuramente pode ser salvo no banco de dados
    return NextResponse.json(updatedSettings, {
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

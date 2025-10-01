import { NextRequest, NextResponse } from 'next/server';

// Simulação de pesquisas recentes (em produção seria do banco de dados)
let recentSearches: string[] = [
  'Supermercado',
  'Gasolina',
  'Restaurante',
  'Farmácia',
  'Transporte'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Retorna as pesquisas mais recentes limitadas
    const limitedSearches = recentSearches.slice(0, limit);
    
    return NextResponse.json(limitedSearches, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pesquisas recentes:', error);
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
    const { search } = body;
    
    if (!search || typeof search !== 'string') {
      return NextResponse.json(
        { error: 'Campo search é obrigatório' },
        { status: 400 }
      );
    }
    
    // Remove a pesquisa se já existir
    recentSearches = recentSearches.filter(s => s.toLowerCase() !== search.toLowerCase());
    
    // Adiciona no início da lista
    recentSearches.unshift(search);
    
    // Mantém apenas os últimos 20 itens
    recentSearches = recentSearches.slice(0, 20);
    
    return NextResponse.json({ success: true, searches: recentSearches }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao adicionar pesquisa recente:', error);
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    if (search) {
      // Remove uma pesquisa específica
      recentSearches = recentSearches.filter(s => s.toLowerCase() !== search.toLowerCase());
    } else {
      // Limpa todas as pesquisas
      recentSearches = [];
    }
    
    return NextResponse.json({ success: true, searches: recentSearches }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro ao remover pesquisa recente:', error);
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

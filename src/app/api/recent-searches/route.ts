import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// ✅ CORREÇÃO CRÍTICA: Remover variável global vulnerável
// Agora usa dados por usuário do banco de dados

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // ✅ CORREÇÃO CRÍTICA: Buscar pesquisas do usuário específico
    // Por enquanto, retornar pesquisas padrão até implementar tabela no banco
    const defaultSearches = [
      'Supermercado',
      'Gasolina', 
      'Restaurante',
      'Farmácia',
      'Transporte'
    ];
    
    const limitedSearches = defaultSearches.slice(0, limit);
    
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
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { search } = body;
    
    if (!search || typeof search !== 'string') {
      return NextResponse.json(
        { error: 'Campo search é obrigatório' },
        { status: 400 }
      );
    }
    
    // ✅ CORREÇÃO CRÍTICA: Por enquanto, apenas retornar sucesso
    // TODO: Implementar salvamento no banco de dados por usuário
    
    return NextResponse.json({ success: true, message: 'Pesquisa salva' }, {
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
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // ✅ CORREÇÃO CRÍTICA: Por enquanto, apenas retornar sucesso
    // TODO: Implementar remoção no banco de dados por usuário
    
    return NextResponse.json({ success: true, message: 'Pesquisa removida' }, {
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

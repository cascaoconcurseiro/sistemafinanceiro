import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/database-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { Category } from '@/types';

// GET /api/categories - Buscar todas as categorias

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'income', 'expense', 'transfer'
    const active = searchParams.get('active'); // 'true', 'false'

    // Buscar categorias do banco (apenas do usuário autenticado)
    const categories = await databaseService.getCategories();

    // ✅ Filtrar apenas categorias do usuário
    let filteredCategories = categories.filter(cat => cat.userId === auth.userId);

    if (type) {
      filteredCategories = filteredCategories.filter(cat => cat.type === type);
    }

    if (active !== null) {
      const isActive = active === 'true';
      filteredCategories = filteredCategories.filter(cat => cat.isActive === isActive);
    }

    return NextResponse.json(filteredCategories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe categoria com mesmo nome e tipo
    const existingCategories = await databaseService.getCategories();
    const duplicate = existingCategories.find(
      cat => cat.name.toLowerCase() === body.name.toLowerCase() &&
             cat.type === body.type &&
             cat.isActive
    );

    if (duplicate) {
      return NextResponse.json(
        { error: 'Já existe uma categoria ativa com este nome e tipo' },
        { status: 409 }
      );
    }

    // Criar categoria
    const categoryData = {
      name: body.name,
      type: body.type,
      color: body.color || '#8884d8',
      icon: body.icon || '📁',
      isActive: body.isActive !== false, // Default true
      userId: auth.userId // ✅ Usar userId autenticado
    };

    const newCategory = await databaseService.createCategory(categoryData);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/categories - Atualizar categoria (bulk update)
export async function PUT(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Esperado array de categorias para atualização em lote' },
        { status: 400 }
      );
    }

    const updatedCategories = [];

    for (const categoryUpdate of body) {
      if (!categoryUpdate.id) {
        continue; // Pular itens sem ID
      }

      try {
        const updated = await databaseService.updateCategory(categoryUpdate.id, categoryUpdate);
        updatedCategories.push(updated);
      } catch (error) {
        console.error(`Erro ao atualizar categoria ${categoryUpdate.id}:`, error);
        // Continuar com as outras categorias
      }
    }

    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error('Erro ao atualizar categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories - Desativar categoria (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se categoria existe
    const categories = await databaseService.getCategories();
    const category = categories.find(cat => cat.id === id);

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se categoria está sendo usada em transações
    const transactions = await databaseService.getTransactions();
    const isUsed = transactions.some(transaction => transaction.categoryId === id);

    if (isUsed) {
      // Soft delete - apenas desativar
      const updatedCategory = await databaseService.updateCategory(id, { isActive: false });
      return NextResponse.json({
        message: 'Categoria desativada (possui transações associadas)',
        category: updatedCategory
      });
    } else {
      // Hard delete - remover completamente
      await databaseService.deleteCategory(id);
      return NextResponse.json({
        message: 'Categoria removida com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

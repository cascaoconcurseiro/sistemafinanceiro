import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/database-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// GET /api/categories/[id] - Buscar categoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    
    const categories = await databaseService.getCategories();
    const category = categories.find(cat => cat.id === id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Atualizar categoria específica
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    // Verificar se categoria existe
    const categories = await databaseService.getCategories();
    const existingCategory = categories.find(cat => cat.id === id);
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Verificar duplicatas se nome ou tipo estão sendo alterados
    if (body.name || body.type) {
      const newName = body.name || existingCategory.name;
      const newType = body.type || existingCategory.type;
      
      const duplicate = categories.find(
        cat => cat.id !== id &&
               cat.name.toLowerCase() === newName.toLowerCase() && 
               cat.type === newType &&
               cat.isActive
      );

      if (duplicate) {
        return NextResponse.json(
          { error: 'Já existe uma categoria ativa com este nome e tipo' },
          { status: 409 }
        );
      }
    }

    const updatedCategory = await databaseService.updateCategory(id, body);
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Deletar categoria específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = params;
    
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
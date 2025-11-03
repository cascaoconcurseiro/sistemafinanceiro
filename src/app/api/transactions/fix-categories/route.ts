import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
export const dynamic = 'force-dynamic';

/**
 * API para corrigir transações sem categoria
 * Atribui uma categoria padrão baseada no tipo da transação
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, categoryName } = body;

        
    // Buscar ou criar categoria
    let category;
    if (categoryId) {
      category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
    } else if (categoryName) {
      category = await prisma.category.findFirst({
        where: {
          name: categoryName,
          userId: auth.userId
        }
      });

      // Se não existe, criar
      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: auth.userId,
            name: categoryName,
            type: 'DESPESA',
            icon: '📦',
            color: '#8B5CF6'
          }
        });
              }
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada ou não especificada' },
        { status: 400 }
      );
    }

    // Buscar transações sem categoria do usuário
    const transactionsWithoutCategory = await prisma.transaction.findMany({
      where: {
        userId: auth.userId,
        categoryId: null,
        deletedAt: null
      }
    });

    console.log(`🔍 [Fix Categories] Encontradas ${transactionsWithoutCategory.length} transações sem categoria`);

    // Atualizar todas as transações
    const result = await prisma.transaction.updateMany({
      where: {
        userId: auth.userId,
        categoryId: null,
        deletedAt: null
      },
      data: {
        categoryId: category.id
      }
    });

    console.log(`✅ [Fix Categories] ${result.count} transações atualizadas`);

    return NextResponse.json({
      success: true,
      message: `${result.count} transações atualizadas com a categoria "${category.name}"`,
      updated: result.count,
      categoryId: category.id,
      categoryName: category.name
    });

  } catch (error) {
    console.error('❌ [Fix Categories] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao atualizar categorias',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [FixShared] Iniciando correção de transações compartilhadas...');

    // Buscar transações com isShared=true mas sharedWith vazio ou null
    const problematicTransactions = await prisma.transaction.findMany({
      where: {
        isShared: true,
        OR: [
          { sharedWith: null },
          { sharedWith: '' },
          { sharedWith: '[]' },
        ]
      }
    });

    console.log(`🔍 [FixShared] Encontradas ${problematicTransactions.length} transações problemáticas`);

    if (problematicTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma transação problemática encontrada',
        fixed: 0
      });
    }

    // Corrigir transações - definir isShared=false para transações sem sharedWith
    const updateResult = await prisma.transaction.updateMany({
      where: {
        isShared: true,
        OR: [
          { sharedWith: null },
          { sharedWith: '' },
          { sharedWith: '[]' },
        ]
      },
      data: {
        isShared: false
      }
    });

    console.log(`✅ [FixShared] Corrigidas ${updateResult.count} transações`);

    return NextResponse.json({
      success: true,
      message: `Corrigidas ${updateResult.count} transações compartilhadas`,
      fixed: updateResult.count,
      details: problematicTransactions.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        isShared: t.isShared,
        sharedWith: t.sharedWith
      }))
    });

  } catch (error) {
    console.error('❌ [FixShared] Erro ao corrigir transações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apenas verificar quantas transações problemáticas existem
    const problematicTransactions = await prisma.transaction.findMany({
      where: {
        isShared: true,
        OR: [
          { sharedWith: null },
          { sharedWith: '' },
          { sharedWith: '[]' },
        ]
      },
      select: {
        id: true,
        description: true,
        amount: true,
        isShared: true,
        sharedWith: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      count: problematicTransactions.length,
      transactions: problematicTransactions
    });

  } catch (error) {
    console.error('❌ [FixShared] Erro ao verificar transações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
/**
 * 🏦 API BALANÇO PATRIMONIAL
 * 
 * Gera relatório de ativos vs passivos em uma data específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { financialCalculationsService } from '@/lib/services/financial-calculations-service';

export const dynamic = 'force-dynamic';

// GET - Gerar Balanço Patrimonial
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Se não informar data, usar data atual
    const date = dateParam ? new Date(dateParam) : new Date();

    if (dateParam && isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Data inválida. Use formato YYYY-MM-DD' },
        { status: 400 }
      );
    }

    console.log('🏦 [API Balanço] Gerando Balanço Patrimonial:', {
      userId: auth.userId,
      data: date.toISOString().split('T')[0]
    });

    const balanco = await financialCalculationsService.generateBalancoPatrimonial(
      auth.userId,
      date
    );

    console.log('✅ [API Balanço] Balanço gerado com sucesso:', {
      totalAtivo: balanco.ativo.total,
      totalPassivo: balanco.passivo.total,
      patrimonioLiquido: balanco.patrimonioLiquido
    });

    return NextResponse.json({
      success: true,
      data: balanco,
      summary: {
        data: balanco.data,
        totalAtivo: balanco.ativo.total,
        totalPassivo: balanco.passivo.total,
        patrimonioLiquido: balanco.patrimonioLiquido,
        situacao: balanco.patrimonioLiquido >= 0 ? 'POSITIVA' : 'NEGATIVA',
        endividamento: balanco.ativo.total > 0 ? (balanco.passivo.total / balanco.ativo.total * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ [API Balanço] Erro ao gerar Balanço:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
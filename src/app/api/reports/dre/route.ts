/**
 * 📊 API DRE - Demonstração do Resultado do Exercício
 * 
 * Gera relatório de receitas vs despesas por período
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { financialCalculationsService } from '@/lib/services/financial-calculations-service';

export const dynamic = 'force-dynamic';

// GET - Gerar DRE por período
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Parâmetros startDate e endDate são obrigatórios (formato: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Datas inválidas. Use formato YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Data inicial deve ser menor que data final' },
        { status: 400 }
      );
    }

    console.log('📊 [API DRE] Gerando DRE:', {
      userId: auth.userId,
      periodo: `${startDateParam} a ${endDateParam}`
    });

    const dre = await financialCalculationsService.generateDRE(
      auth.userId,
      startDate,
      endDate
    );

    console.log('✅ [API DRE] DRE gerada com sucesso:', {
      totalReceitas: dre.totalReceitas,
      totalDespesas: dre.totalDespesas,
      resultado: dre.resultado
    });

    return NextResponse.json({
      success: true,
      data: dre,
      summary: {
        periodo: dre.periodo,
        totalReceitas: dre.totalReceitas,
        totalDespesas: dre.totalDespesas,
        resultado: dre.resultado,
        situacao: dre.resultado >= 0 ? 'LUCRO' : 'PREJUÍZO',
        margemLucro: dre.totalReceitas > 0 ? (dre.resultado / dre.totalReceitas * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ [API DRE] Erro ao gerar DRE:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
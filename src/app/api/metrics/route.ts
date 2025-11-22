/**
 * ENDPOINT DE MÉTRICAS
 * Expõe métricas do sistema para monitoramento
 */

import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export async function GET() {
  try {
    const summary = metrics.getSummary();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao obter métricas' },
      { status: 500 }
    );
  }
}

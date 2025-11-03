import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * POST /api/maintenance/recalculate-balances
 * Recalcula todos os saldos das contas do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    
    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const results = await service.recalculateBalances(auth.userId);

    
    return NextResponse.json({
      success: true,
      message: `Saldos de ${results.length} contas recalculados com sucesso`,
      results: results.map(r => ({
        accountId: r.accountId,
        accountName: r.accountName,
        oldBalance: Number(r.oldBalance),
        newBalance: Number(r.newBalance),
        difference: Number(r.difference),
      })),
    });
  } catch (error) {
    console.error('❌ [API Maintenance] Erro ao recalcular saldos:', error);

    return NextResponse.json(
      { error: 'Erro ao recalcular saldos' },
      { status: 500 }
    );
  }
}

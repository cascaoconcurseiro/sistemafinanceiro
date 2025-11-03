import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { FinancialAuditService } from '@/lib/services/financial-audit-service';
export const dynamic = 'force-dynamic';


/**
 * GET - Verificar integridade financeira
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    
    const result = await FinancialAuditService.checkIntegrity(auth.userId);

    
    return NextResponse.json({
      success: true,
      integrity: result
    });
  } catch (error) {
    console.error('❌ [Integrity Check] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar integridade' },
      { status: 500 }
    );
  }
}

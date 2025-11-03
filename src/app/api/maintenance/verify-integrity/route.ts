import { NextRequest, NextResponse } from 'next/server';
import { FinancialOperationsService } from '@/lib/services/financial-operations-service';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

/**
 * GET /api/maintenance/verify-integrity
 * Verifica a integridade financeira dos dados do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    
    // ✅ USAR SERVIÇO FINANCEIRO
    const service = new FinancialOperationsService();
    const issues = await service.verifyIntegrity(auth.userId);

    const hasIssues = issues.length > 0;

    console.log(
      hasIssues
        ? `⚠️ [API Maintenance] ${issues.length} problemas encontrados`
        : '✅ [API Maintenance] Nenhum problema encontrado'
    );

    return NextResponse.json({
      success: true,
      hasIssues,
      issuesCount: issues.length,
      issues: issues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        details: issue.details,
      })),
    });
  } catch (error) {
    console.error('❌ [API Maintenance] Erro ao verificar integridade:', error);

    return NextResponse.json(
      { error: 'Erro ao verificar integridade' },
      { status: 500 }
    );
  }
}

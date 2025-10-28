/**
 * 🏦 API DE VALIDAÇÃO CONTÁBIL
 * 
 * Endpoints para validar integridade contábil:
 * - Balanceamento geral do sistema
 * - Reconciliação de contas
 * - Relatório de balancete
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { doubleEntryService } from '@/lib/services/double-entry-service';

export const dynamic = 'force-dynamic';

// GET - Validar balanceamento geral do sistema
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('🔍 [API Accounting] Validando balanceamento do sistema...');

    // Validar balanceamento geral
    const systemBalance = await doubleEntryService.validateSystemBalance();
    
    // Gerar balancete do usuário
    const trialBalance = await doubleEntryService.generateTrialBalance(auth.userId);

    // Verificar reconciliação de todas as contas
    const reconciliationResults = [];
    for (const account of trialBalance) {
      try {
        const reconciliation = await doubleEntryService.reconcileAccount(account.accountId);
        reconciliationResults.push({
          accountId: account.accountId,
          accountName: account.accountName,
          ...reconciliation
        });
      } catch (error) {
        reconciliationResults.push({
          accountId: account.accountId,
          accountName: account.accountName,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    const response = {
      systemBalance,
      trialBalance,
      reconciliation: reconciliationResults,
      summary: {
        totalAccounts: trialBalance.length,
        reconciledAccounts: reconciliationResults.filter(r => r.isReconciled).length,
        unreconciledAccounts: reconciliationResults.filter(r => !r.isReconciled && !r.error).length,
        accountsWithErrors: reconciliationResults.filter(r => r.error).length,
        systemIsBalanced: systemBalance.isBalanced
      }
    };

    console.log('✅ [API Accounting] Validação concluída:', {
      systemBalanced: systemBalance.isBalanced,
      totalAccounts: trialBalance.length,
      reconciledAccounts: response.summary.reconciledAccounts
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API Accounting] Erro na validação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Reconciliar conta específica
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [API Accounting] Reconciliando conta:', accountId);

    const reconciliation = await doubleEntryService.reconcileAccount(accountId);

    console.log('✅ [API Accounting] Reconciliação concluída:', {
      accountId,
      isReconciled: reconciliation.isReconciled,
      difference: reconciliation.difference
    });

    return NextResponse.json(reconciliation);
  } catch (error) {
    console.error('❌ [API Accounting] Erro na reconciliação:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
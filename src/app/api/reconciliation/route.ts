import { NextRequest, NextResponse } from 'next/server'
import { runReconciliation, fixAccountBalances } from '@/lib/reconciliation-job'
import { authenticateRequest } from '@/lib/utils/auth-helpers'

// ✅ CORREÇÃO CRÍTICA: Executar reconciliação manual APENAS para usuários autenticados

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação obrigatória
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const autoFix = searchParams.get('autoFix') === 'true'

    console.log(`Iniciando reconciliação manual para usuário ${auth.userId}...`)
    
    // ✅ CORREÇÃO CRÍTICA: Passar userId para reconciliação
    const report = await runReconciliation(auth.userId)

    // Se autoFix estiver habilitado e houver contas desbalanceadas
    if (autoFix && report.unbalancedAccounts > 0) {
      console.log('Executando correção automática de saldos...')
      const unbalancedAccountIds = report.results
        .filter(r => !r.isBalanced)
        .map(r => r.accountId)
      
      const fixResult = await fixAccountBalances(unbalancedAccountIds)
      
      return NextResponse.json({
        reconciliation: report,
        autoFix: {
          executed: true,
          accountsFixed: fixResult.fixed,
          errors: fixResult.errors
        }
      })
    }

    return NextResponse.json({
      reconciliation: report,
      autoFix: {
        executed: false,
        message: autoFix ? 'Nenhuma conta precisou de correção' : 'Correção automática não solicitada'
      }
    })

  } catch (error) {
    console.error('Erro na reconciliação:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Corrigir saldos específicos
export async function POST(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação obrigatória
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { accountIds } = await request.json()

    if (!Array.isArray(accountIds)) {
      return NextResponse.json(
        { error: 'accountIds deve ser um array' },
        { status: 400 }
      )
    }

    // ✅ CORREÇÃO CRÍTICA: Verificar se todas as contas pertencem ao usuário
    const { prisma } = await import('@/lib/prisma');
    const userAccounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        userId: auth.userId
      },
      select: { id: true }
    });

    const validAccountIds = userAccounts.map(acc => acc.id);
    
    if (validAccountIds.length !== accountIds.length) {
      return NextResponse.json(
        { error: 'Algumas contas não pertencem ao usuário ou não existem' },
        { status: 403 }
      );
    }

    console.log(`Corrigindo saldos para ${validAccountIds.length} contas do usuário ${auth.userId}...`)
    const result = await fixAccountBalances(validAccountIds)

    return NextResponse.json({
      success: true,
      accountsFixed: result.fixed,
      errors: result.errors,
      message: `${result.fixed} contas corrigidas com sucesso`
    })

  } catch (error) {
    console.error('Erro na correção de saldos:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

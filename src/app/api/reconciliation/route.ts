import { NextRequest, NextResponse } from 'next/server'
import { runReconciliation, fixAccountBalances } from '@/lib/reconciliation-job'

// Executar reconciliação manual
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const autoFix = searchParams.get('autoFix') === 'true'

    console.log('Iniciando reconciliação manual...')
    const report = await runReconciliation()

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
    const { accountIds } = await request.json()

    if (!Array.isArray(accountIds)) {
      return NextResponse.json(
        { error: 'accountIds deve ser um array' },
        { status: 400 }
      )
    }

    console.log(`Corrigindo saldos para ${accountIds.length} contas...`)
    const result = await fixAccountBalances(accountIds)

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
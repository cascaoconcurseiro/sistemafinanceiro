import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ReconciliationResult {
  accountId: string
  accountName: string
  expectedBalance: number
  actualBalance: number
  difference: number
  isBalanced: boolean
  transactionCount: number
  lastTransactionDate: Date | null
}

interface ReconciliationReport {
  timestamp: Date
  totalAccounts: number
  balancedAccounts: number
  unbalancedAccounts: number
  totalDifference: number
  results: ReconciliationResult[]
  errors: string[]
}

/**
 * Calcula o saldo esperado de uma conta baseado em todas as transações não deletadas
 */
async function calculateExpectedBalance(accountId: string): Promise<{
  balance: number
  transactionCount: number
  lastTransactionDate: Date | null
}> {
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId,
      deletedAt: null,
      status: 'cleared' // Apenas transações efetivadas
    },
    orderBy: {
      date: 'desc'
    }
  })

  let balance = 0
  for (const transaction of transactions) {
    if (transaction.type === 'credit') {
      balance += transaction.amount
    } else {
      balance -= transaction.amount
    }
  }

  return {
    balance,
    transactionCount: transactions.length,
    lastTransactionDate: transactions.length > 0 ? transactions[0].date : null
  }
}

/**
 * Executa a reconciliação de uma conta específica
 */
async function reconcileAccount(accountId: string): Promise<ReconciliationResult> {
  const account = await prisma.account.findUnique({
    where: { id: accountId }
  })

  if (!account) {
    throw new Error(`Conta não encontrada: ${accountId}`)
  }

  const { balance: expectedBalance, transactionCount, lastTransactionDate } = 
    await calculateExpectedBalance(accountId)

  const actualBalance = account.balance
  const difference = Math.abs(expectedBalance - actualBalance)
  const isBalanced = difference < 0.01 // Tolerância de 1 centavo

  return {
    accountId,
    accountName: account.name,
    expectedBalance,
    actualBalance,
    difference,
    isBalanced,
    transactionCount,
    lastTransactionDate
  }
}

/**
 * Executa a reconciliação de todas as contas ativas
 */
export async function runReconciliation(): Promise<ReconciliationReport> {
  const report: ReconciliationReport = {
    timestamp: new Date(),
    totalAccounts: 0,
    balancedAccounts: 0,
    unbalancedAccounts: 0,
    totalDifference: 0,
    results: [],
    errors: []
  }

  try {
    // Buscar todas as contas ativas
    const accounts = await prisma.account.findMany({
      where: {
        isActive: true,
        deletedAt: null
      }
    })

    report.totalAccounts = accounts.length

    // Reconciliar cada conta
    for (const account of accounts) {
      try {
        const result = await reconcileAccount(account.id)
        report.results.push(result)

        if (result.isBalanced) {
          report.balancedAccounts++
        } else {
          report.unbalancedAccounts++
          report.totalDifference += result.difference
        }
      } catch (error) {
        const errorMessage = `Erro ao reconciliar conta ${account.name} (${account.id}): ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
        report.errors.push(errorMessage)
        console.error(errorMessage)
      }
    }

    // Log do resultado
    console.log(`Reconciliação concluída: ${report.balancedAccounts}/${report.totalAccounts} contas balanceadas`)
    
    if (report.unbalancedAccounts > 0) {
      console.warn(`${report.unbalancedAccounts} contas com diferenças encontradas. Diferença total: R$ ${report.totalDifference.toFixed(2)}`)
    }

    return report

  } catch (error) {
    const errorMessage = `Erro geral na reconciliação: ${
      error instanceof Error ? error.message : 'Erro desconhecido'
    }`
    report.errors.push(errorMessage)
    console.error(errorMessage)
    throw error
  }
}

/**
 * Corrige automaticamente saldos desbalanceados (usar com cuidado)
 */
export async function fixAccountBalances(accountIds?: string[]): Promise<{
  fixed: number
  errors: string[]
}> {
  const result = {
    fixed: 0,
    errors: []
  }

  try {
    let accounts
    if (accountIds && accountIds.length > 0) {
      accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds },
          isActive: true,
          deletedAt: null
        }
      })
    } else {
      accounts = await prisma.account.findMany({
        where: {
          isActive: true,
          deletedAt: null
        }
      })
    }

    for (const account of accounts) {
      try {
        const { balance: expectedBalance } = await calculateExpectedBalance(account.id)
        
        if (Math.abs(expectedBalance - account.balance) >= 0.01) {
          await prisma.account.update({
            where: { id: account.id },
            data: { balance: expectedBalance }
          })
          
          result.fixed++
          console.log(`Saldo corrigido para conta ${account.name}: ${account.balance} → ${expectedBalance}`)
        }
      } catch (error) {
        const errorMessage = `Erro ao corrigir conta ${account.name}: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
        result.errors.push(errorMessage)
        console.error(errorMessage)
      }
    }

    return result

  } catch (error) {
    const errorMessage = `Erro geral na correção de saldos: ${
      error instanceof Error ? error.message : 'Erro desconhecido'
    }`
    result.errors.push(errorMessage)
    console.error(errorMessage)
    throw error
  }
}

/**
 * Agenda a execução periódica da reconciliação
 */
export function scheduleReconciliation(intervalMinutes: number = 60) {
  console.log(`Agendando reconciliação a cada ${intervalMinutes} minutos`)
  
  setInterval(async () => {
    try {
      console.log('Iniciando reconciliação automática...')
      const report = await runReconciliation()
      
      if (report.unbalancedAccounts > 0) {
        console.warn(`Reconciliação encontrou ${report.unbalancedAccounts} contas desbalanceadas`)
        // Aqui você poderia enviar notificações, emails, etc.
      }
    } catch (error) {
      console.error('Erro na reconciliação automática:', error)
    }
  }, intervalMinutes * 60 * 1000)
}
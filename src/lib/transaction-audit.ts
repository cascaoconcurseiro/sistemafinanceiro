import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TransactionAuditData {
  transactionId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERSE' | 'CANCEL'
  oldValue?: any
  newValue?: any
  userId?: string
  ipAddress?: string
  userAgent?: string
  reason?: string
}

/**
 * Registra uma operação de auditoria para uma transação
 */
export async function logTransactionAudit(data: TransactionAuditData) {
  try {
    await prisma.transactionAudit.create({
      data: {
        transactionId: data.transactionId,
        action: data.action,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        reason: data.reason,
      }
    })
  } catch (error) {
    console.error('Erro ao registrar auditoria de transação:', error)
    // Não falha a operação principal se a auditoria falhar
  }
}

/**
 * Obtém o histórico de auditoria de uma transação
 */
export async function getTransactionAuditHistory(transactionId: string) {
  return await prisma.transactionAudit.findMany({
    where: { transactionId },
    orderBy: { timestamp: 'desc' }
  })
}

/**
 * Valida se uma transação pode ser editada
 */
export function canEditTransaction(transaction: any): boolean {
  // Não pode editar transações excluídas
  if (transaction.deletedAt) return false
  
  // Não pode editar estornos
  if (transaction.isReversal) return false
  
  // Não pode editar parcelas já liquidadas (cleared)
  if (transaction.parentTransactionId && transaction.status === 'cleared') {
    return false
  }
  
  return true
}

/**
 * Valida se uma transação pode ser excluída
 */
export function canDeleteTransaction(transaction: any): boolean {
  // Não pode excluir transações já excluídas
  if (transaction.deletedAt) return false
  
  // Não pode excluir estornos (deve estornar a transação original)
  if (transaction.isReversal) return false
  
  // Não pode excluir parcelas já liquidadas
  if (transaction.parentTransactionId && transaction.status === 'cleared') {
    return false
  }
  
  return true
}

/**
 * Calcula o saldo de uma conta baseado nas transações cleared
 */
export async function calculateAccountBalance(accountId: string): Promise<number> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      transactions: {
        where: {
          status: 'cleared',
          deletedAt: null // Não incluir transações excluídas
        }
      }
    }
  })
  
  if (!account) throw new Error('Conta não encontrada')
  
  let calculatedBalance = Number(account.balance) || 0
  
  for (const transaction of account.transactions) {
    const amount = Math.abs(Number(transaction.amount))
    
    if (transaction.type === 'credit') {
      calculatedBalance += amount
    } else if (transaction.type === 'debit') {
      calculatedBalance -= amount
    }
  }
  
  return calculatedBalance
}

/**
 * Recalcula e atualiza o saldo de uma conta
 */
export async function recalculateAccountBalance(accountId: string, tx?: any) {
  const prismaClient = tx || prisma
  
  const newBalance = await calculateAccountBalance(accountId)
  
  await prismaClient.account.update({
    where: { id: accountId },
    data: { balance: newBalance }
  })
  
  return newBalance
}

/**
 * Cria uma transação de estorno
 */
export async function createReversalTransaction(
  originalTransactionId: string,
  reason: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const originalTransaction = await prisma.transaction.findUnique({
    where: { id: originalTransactionId }
  })
  
  if (!originalTransaction) {
    throw new Error('Transação original não encontrada')
  }
  
  if (originalTransaction.isReversal) {
    throw new Error('Não é possível estornar uma transação de estorno')
  }
  
  if (originalTransaction.deletedAt) {
    throw new Error('Não é possível estornar uma transação excluída')
  }
  
  // Criar transação de estorno
  const reversalTransaction = await prisma.transaction.create({
    data: {
      accountId: originalTransaction.accountId,
      amount: originalTransaction.amount,
      description: `ESTORNO: ${originalTransaction.description}`,
      category: originalTransaction.category,
      type: originalTransaction.type === 'credit' ? 'debit' : 'credit', // Inverter o tipo
      date: new Date(),
      status: 'cleared',
      isReversal: true,
      reversalOf: originalTransactionId,
    }
  })
  
  // Registrar auditoria para ambas as transações
  await logTransactionAudit({
    transactionId: originalTransactionId,
    action: 'REVERSE',
    newValue: { reversedBy: reversalTransaction.id },
    userId,
    ipAddress,
    userAgent,
    reason
  })
  
  await logTransactionAudit({
    transactionId: reversalTransaction.id,
    action: 'CREATE',
    newValue: reversalTransaction,
    userId,
    ipAddress,
    userAgent,
    reason: `Estorno da transação ${originalTransactionId}`
  })
  
  // Recalcular saldo da conta
  await recalculateAccountBalance(originalTransaction.accountId)
  
  return reversalTransaction
}
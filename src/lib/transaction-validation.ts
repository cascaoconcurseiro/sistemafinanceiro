import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Tipos válidos de transação
export const TRANSACTION_TYPES = ['credit', 'debit', 'transfer', 'shared'] as const
export type TransactionType = typeof TRANSACTION_TYPES[number]

// Estados válidos de transação
export const TRANSACTION_STATUSES = ['pending', 'cleared', 'canceled'] as const
export type TransactionStatus = typeof TRANSACTION_STATUSES[number]

// Tipos válidos de conta
export const ACCOUNT_TYPES = ['corrente', 'poupanca', 'cartao', 'carteira', 'investimento'] as const
export type AccountType = typeof ACCOUNT_TYPES[number]

// Tipos de transferência
export const TRANSFER_TYPES = ['origin', 'destination'] as const
export type TransferType = typeof TRANSFER_TYPES[number]

export interface TransactionValidationError {
  field: string
  message: string
  code: string
}

export interface CreateTransactionData {
  accountId: string
  amount: number
  description: string
  category: string
  type: TransactionType
  date: Date
  status?: TransactionStatus
  transferId?: string
  transferType?: TransferType
  parentTransactionId?: string
  installmentNumber?: number
  totalInstallments?: number
  tripId?: string
}

/**
 * Valida os dados de uma nova transação
 */
export async function validateCreateTransaction(data: CreateTransactionData, prismaClient?: any): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: TransactionValidationError[] = []
  const client = prismaClient || prisma

  // 1. Conta obrigatória
  if (!data.accountId) {
    errors.push({
      field: 'accountId',
      message: 'Conta é obrigatória',
      code: 'ACCOUNT_REQUIRED'
    })
  } else {
    // Verificar se a conta existe e está ativa
    const account = await client.account.findUnique({
      where: { id: data.accountId }
    })
    
    if (!account) {
      errors.push({
        field: 'accountId',
        message: 'Conta não encontrada',
        code: 'ACCOUNT_NOT_FOUND'
      })
    } else if (!account.isActive || account.deletedAt) {
      errors.push({
        field: 'accountId',
        message: 'Conta inativa ou excluída',
        code: 'ACCOUNT_INACTIVE'
      })
    }
  }

  // 2. Tipo de transação obrigatório e válido
  if (!data.type) {
    errors.push({
      field: 'type',
      message: 'Tipo de transação é obrigatório',
      code: 'TYPE_REQUIRED'
    })
  } else if (!TRANSACTION_TYPES.includes(data.type)) {
    errors.push({
      field: 'type',
      message: `Tipo de transação inválido. Deve ser: ${TRANSACTION_TYPES.join(', ')}`,
      code: 'TYPE_INVALID'
    })
  }

  // 3. Valor obrigatório e positivo
  if (data.amount === undefined || data.amount === null) {
    errors.push({
      field: 'amount',
      message: 'Valor é obrigatório',
      code: 'AMOUNT_REQUIRED'
    })
  } else if (data.amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Valor deve ser positivo',
      code: 'AMOUNT_POSITIVE'
    })
  }

  // 4. Descrição obrigatória
  if (!data.description || data.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Descrição é obrigatória',
      code: 'DESCRIPTION_REQUIRED'
    })
  }

  // 5. Categoria obrigatória
  if (!data.category || data.category.trim() === '') {
    errors.push({
      field: 'category',
      message: 'Categoria é obrigatória',
      code: 'CATEGORY_REQUIRED'
    })
  }

  // 6. Data obrigatória
  if (!data.date) {
    errors.push({
      field: 'date',
      message: 'Data é obrigatória',
      code: 'DATE_REQUIRED'
    })
  }

  // 7. Status válido
  if (data.status && !TRANSACTION_STATUSES.includes(data.status)) {
    errors.push({
      field: 'status',
      message: `Status inválido. Deve ser: ${TRANSACTION_STATUSES.join(', ')}`,
      code: 'STATUS_INVALID'
    })
  }

  // 8. Validações específicas para transferências
  if (data.type === 'transfer') {
    if (!data.transferId) {
      errors.push({
        field: 'transferId',
        message: 'TransferID é obrigatório para transferências',
        code: 'TRANSFER_ID_REQUIRED'
      })
    }
    
    if (!data.transferType) {
      errors.push({
        field: 'transferType',
        message: 'Tipo de transferência é obrigatório',
        code: 'TRANSFER_TYPE_REQUIRED'
      })
    } else if (!TRANSFER_TYPES.includes(data.transferType)) {
      errors.push({
        field: 'transferType',
        message: `Tipo de transferência inválido. Deve ser: ${TRANSFER_TYPES.join(', ')}`,
        code: 'TRANSFER_TYPE_INVALID'
      })
    }
  }

  // 9. Validações específicas para parcelamento
  if (data.parentTransactionId) {
    if (!data.installmentNumber || data.installmentNumber <= 0) {
      errors.push({
        field: 'installmentNumber',
        message: 'Número da parcela deve ser positivo',
        code: 'INSTALLMENT_NUMBER_INVALID'
      })
    }
    
    if (!data.totalInstallments || data.totalInstallments <= 0) {
      errors.push({
        field: 'totalInstallments',
        message: 'Total de parcelas deve ser positivo',
        code: 'TOTAL_INSTALLMENTS_INVALID'
      })
    }
    
    if (data.installmentNumber && data.totalInstallments && 
        data.installmentNumber > data.totalInstallments) {
      errors.push({
        field: 'installmentNumber',
        message: 'Número da parcela não pode ser maior que o total',
        code: 'INSTALLMENT_NUMBER_EXCEEDS_TOTAL'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.map(error => error.message)
  }
}

/**
 * Valida se uma conta pode ser excluída
 */
export async function validateAccountDeletion(accountId: string): Promise<TransactionValidationError[]> {
  const errors: TransactionValidationError[] = []
  
  // Verificar se existem transações cleared na conta
  const clearedTransactions = await prisma.transaction.count({
    where: {
      accountId,
      status: 'cleared',
      deletedAt: null
    }
  })
  
  if (clearedTransactions > 0) {
    errors.push({
      field: 'accountId',
      message: 'Não é possível excluir conta com transações liquidadas',
      code: 'ACCOUNT_HAS_CLEARED_TRANSACTIONS'
    })
  }
  
  return errors
}

/**
 * Valida se uma transferência está completa (origem e destino)
 */
export function validateTransferCompleteness(transferData: TransferData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!transferData.fromAccountId) {
    errors.push('Conta de origem é obrigatória')
  }
  
  if (!transferData.toAccountId) {
    errors.push('Conta de destino é obrigatória')
  }
  
  if (!transferData.description) {
    errors.push('Descrição é obrigatória')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida consistência de valores em transferência
 */
export function validateTransferAmounts(transferData: TransferData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!transferData.amount || transferData.amount <= 0) {
    errors.push('Valor da transferência deve ser positivo')
  }
  
  if (transferData.fromAccountId === transferData.toAccountId) {
    errors.push('Conta de origem e destino devem ser diferentes')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
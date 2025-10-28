export async function recalculateAccountBalance(accountId: string) {
  // Stub implementation
  console.log(`Recalculating balance for account: ${accountId}`);
}

export function canEditTransaction(transaction: any): boolean {
  // Por enquanto, permitir editar todas as transações
  // Futuramente pode incluir lógica para transações reconciliadas, etc.
  return true;
}

export function canDeleteTransaction(transaction: any): boolean {
  // Por enquanto, permitir deletar todas as transações
  // Futuramente pode incluir lógica para transações reconciliadas, etc.
  return true;
}

export function logTransactionAudit(action: string, transactionId: string, details?: any) {
  // Log de auditoria para transações
  console.log(`[AUDIT] ${action} - Transaction: ${transactionId}`, details);
}

export function createReversalTransaction(originalTransaction: any) {
  // Criar transação de reversão
  const reversalTransaction = {
    ...originalTransaction,
    id: `reversal-${originalTransaction.id}`,
    amount: -originalTransaction.amount,
    description: `Reversão: ${originalTransaction.description}`,
    type: originalTransaction.type === 'income' ? 'expense' : 'income',
    notes: `Reversão da transação ${originalTransaction.id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('Transação de reversão criada:', reversalTransaction);
  return reversalTransaction;
}

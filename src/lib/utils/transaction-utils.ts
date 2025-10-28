/**
 * Utilitários para trabalhar com transações
 * 
 * Centraliza a lógica de verificação de tipos de transação
 * para garantir consistência em todo o sistema.
 */

/**
 * Verifica se uma transação é uma receita
 * Aceita ambos os formatos: 'income' e 'RECEITA'
 */
export function isIncome(type: string): boolean {
  return type === 'income' || type === 'RECEITA';
}

/**
 * Verifica se uma transação é uma despesa
 * Aceita ambos os formatos: 'expense' e 'DESPESA'
 */
export function isExpense(type: string): boolean {
  return type === 'expense' || type === 'DESPESA';
}

/**
 * Verifica se uma transação é uma transferência
 */
export function isTransfer(type: string): boolean {
  return type === 'transfer' || type === 'TRANSFERENCIA';
}

/**
 * Normaliza o tipo de transação para o formato da API (maiúsculo)
 */
export function normalizeTransactionType(type: string): 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA' {
  if (isIncome(type)) return 'RECEITA';
  if (isExpense(type)) return 'DESPESA';
  if (isTransfer(type)) return 'TRANSFERENCIA';
  return 'DESPESA'; // fallback
}

/**
 * Calcula o impacto de uma transação no saldo
 * Receitas aumentam o saldo (+)
 * Despesas diminuem o saldo (-)
 */
export function getTransactionImpact(type: string, amount: number): number {
  const absAmount = Math.abs(amount);
  if (isIncome(type)) return absAmount;
  if (isExpense(type)) return -absAmount;
  return 0;
}

/**
 * Retorna o sinal correto para exibição (+/-)
 */
export function getTransactionSign(type: string): '+' | '-' {
  return isIncome(type) ? '+' : '-';
}

/**
 * Retorna a cor apropriada para o tipo de transação
 */
export function getTransactionColor(type: string): string {
  if (isIncome(type)) return 'text-green-600';
  if (isExpense(type)) return 'text-red-600';
  if (isTransfer(type)) return 'text-blue-600';
  return 'text-gray-600';
}

/**
 * Retorna o label em português para o tipo
 */
export function getTransactionTypeLabel(type: string): string {
  if (isIncome(type)) return 'Receita';
  if (isExpense(type)) return 'Despesa';
  if (isTransfer(type)) return 'Transferência';
  return 'Desconhecido';
}

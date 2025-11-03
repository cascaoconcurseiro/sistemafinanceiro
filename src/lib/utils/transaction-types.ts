/**
 * 🔄 UTILITÁRIO DE CONVERSÃO DE TIPOS DE TRANSAÇÃO
 *
 * Padroniza os tipos de transação entre frontend e backend
 * - Backend/Banco: RECEITA, DESPESA, TRANSFERENCIA (maiúsculo)
 * - Frontend: income, expense, transfer (minúsculo)
 */

export const TransactionType = {
  RECEITA: 'RECEITA',
  DESPESA: 'DESPESA',
  TRANSFERENCIA: 'TRANSFERENCIA',
} as const;

export type TransactionTypeDB = typeof TransactionType[keyof typeof TransactionType];
export type TransactionTypeFrontend = 'income' | 'expense' | 'transfer';

/**
 * Converter tipo do frontend para o banco de dados
 */
export function toDBType(frontendType: string): TransactionTypeDB {
  const map: Record<string, TransactionTypeDB> = {
    'income': TransactionType.RECEITA,
    'expense': TransactionType.DESPESA,
    'transfer': TransactionType.TRANSFERENCIA,
    'RECEITA': TransactionType.RECEITA,
    'DESPESA': TransactionType.DESPESA,
    'TRANSFERENCIA': TransactionType.TRANSFERENCIA,
  };
  return map[frontendType] || TransactionType.DESPESA;
}

/**
 * Converter tipo do banco de dados para o frontend
 */
export function toFrontendType(dbType: string): TransactionTypeFrontend {
  const map: Record<string, TransactionTypeFrontend> = {
    'RECEITA': 'income',
    'DESPESA': 'expense',
    'TRANSFERENCIA': 'transfer',
    'income': 'income',
    'expense': 'expense',
    'transfer': 'transfer',
  };
  return map[dbType] || 'expense';
}

/**
 * Verificar se é receita (aceita ambos os formatos)
 */
export function isIncome(type: string): boolean {
  return type === 'income' || type === 'RECEITA';
}

/**
 * Verificar se é despesa (aceita ambos os formatos)
 */
export function isExpense(type: string): boolean {
  return type === 'expense' || type === 'DESPESA';
}

/**
 * Verificar se é transferência (aceita ambos os formatos)
 */
export function isTransfer(type: string): boolean {
  return type === 'transfer' || type === 'TRANSFERENCIA';
}

/**
 * Normalizar tipo (sempre retorna formato do banco)
 */
export function normalizeType(type: string): TransactionTypeDB {
  return toDBType(type);
}

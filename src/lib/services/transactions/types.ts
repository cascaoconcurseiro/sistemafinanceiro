/**
 * TIPOS COMPARTILHADOS - TRANSAÇÕES
 * Tipos usados em todos os módulos de transações
 */

import { TransactionInput } from '@/lib/validation/schemas';

export interface CreateTransactionOptions {
  transaction: TransactionInput;
  createJournalEntries?: boolean;
  linkToInvoice?: boolean;
}

export interface CreateInstallmentsOptions {
  baseTransaction: TransactionInput;
  totalInstallments: number;
  firstDueDate: Date;
  frequency: 'monthly' | 'weekly' | 'daily';
}

export interface CreateTransferOptions {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: Date;
  userId: string;
}

export interface CreateSharedExpenseOptions {
  transaction: TransactionInput;
  sharedWith: string[]; // IDs dos participantes
  splitType: 'equal' | 'percentage' | 'custom';
  splits?: Record<string, number>; // Para custom
}

export interface TransactionResult {
  transaction: any;
  relatedRecords?: any[];
}

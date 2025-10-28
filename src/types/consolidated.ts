/**
 * TIPOS CONSOLIDADOS DO SISTEMA SUAGRANA
 * 
 * Este arquivo centraliza TODAS as definições de tipos TypeScript do sistema.
 * Objetivo: Eliminar duplicações e garantir consistência em todo o projeto.
 * 
 * REGRAS:
 * 1. Este é o ÚNICO local para definições de tipos principais
 * 2. Todos os outros arquivos devem importar deste arquivo
 * 3. Não criar interfaces duplicadas em outros arquivos
 * 4. Manter compatibilidade com o schema Prisma
 */

// ============================================================================
// TIPOS BASE E UTILITÁRIOS
// ============================================================================

export type UUID = string;
export type Decimal = number;
export type DateString = string; // ISO date string
export type TimestampString = string; // ISO timestamp string

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ENUMS PRINCIPAIS
// ============================================================================

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  CREDIT = 'credit',
  CASH = 'cash'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

export enum InvestmentStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CLOSED = 'closed'
}

export enum TripStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

/**
 * USUÁRIO
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
}

/**
 * CONTA FINANCEIRA
 * Saldo é calculado dinamicamente, não armazenado
 */
export interface Account extends BaseEntity {
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  description?: string;
  isActive: boolean;
  
  // Configurações específicas para cartão de crédito
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  
  // Configurações da conta
  allowNegativeBalance?: boolean;
  
  // Campos calculados (não persistidos)
  balance?: number;
  formattedBalance?: string;
  bank?: string; // Para compatibilidade
}

/**
 * TRANSAÇÃO - UNIDADE MÍNIMA DO SISTEMA FINANCEIRO
 * Esta é a única fonte da verdade para todas as operações financeiras
 */
export interface Transaction extends BaseEntity {
  userId: string;
  
  // Campos obrigatórios - núcleo da transação
  amount: number; // Valor sempre positivo, o tipo define se é entrada ou saída
  description: string;
  date: string; // Data da transação (não confundir com data de criação)
  accountId: string; // Conta de origem/destino
  categoryId: string; // Categoria obrigatória para classificação
  type: TransactionType; // Tipo fundamental da operação
  status: TransactionStatus; // Status da transação
  
  // Campos para transferências (quando type = 'transfer')
  toAccountId?: string; // Conta de destino para transferências
  transferId?: string; // ID que conecta as duas transações de uma transferência
  transferGroupId?: string; // ID do grupo de transferência
  transferAccount?: string; // Nome da conta de destino (calculado)
  transferAccountName?: string; // Nome da conta de destino (calculado)
  
  // Campos para cartão de crédito e parcelamento
  parentTransactionId?: string; // Para transações filhas (parcelas)
  installmentNumber?: number; // Número da parcela atual
  totalInstallments?: number; // Total de parcelas
  creditCardId?: string; // ID do cartão de crédito
  dueDate?: string; // Data de vencimento (para cartão de crédito)
  
  // Campos para recorrência
  recurringRuleId?: string; // ID da regra de recorrência
  isRecurring?: boolean; // Se é uma transação recorrente
  
  // Campos opcionais para enriquecimento
  notes?: string;
  tags?: string[]; // Tags para classificação adicional
  location?: string; // Local da transação
  receipt?: string; // URL ou referência do comprovante
  attachments?: string[]; // Anexos
  
  // Campos de auditoria
  createdBy?: string; // Usuário que criou
  lastModifiedBy?: string; // Último usuário que modificou
  
  // Metadados para integrações
  externalId?: string; // ID de sistemas externos (bancos, APIs)
  source?: 'manual' | 'import' | 'api' | 'recurring'; // Origem da transação
  
  // Campos calculados (não persistidos, calculados dinamicamente)
  runningBalance?: number; // Saldo corrente após esta transação
  categoryName?: string; // Nome da categoria (join)
  accountName?: string; // Nome da conta (join)
  
  // Compatibilidade com versões antigas
  category?: string; // Para compatibilidade
  account?: string; // Para compatibilidade
  subcategory?: string; // Para compatibilidade
}

/**
 * CATEGORIA DE TRANSAÇÃO
 */
export interface Category extends BaseEntity {
  userId: string;
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
  isActive: boolean;
}

/**
 * META FINANCEIRA
 */
export interface Goal extends BaseEntity {
  userId: string;
  name: string; // Também aceita 'title' para compatibilidade
  title?: string; // Para compatibilidade
  description?: string;
  target: number; // Também aceita 'targetAmount'
  targetAmount?: number; // Para compatibilidade
  current: number; // Também aceita 'currentAmount'
  currentAmount?: number; // Para compatibilidade
  deadline?: string; // Também aceita 'targetDate'
  targetDate?: string; // Para compatibilidade
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: GoalStatus;
  isCompleted: boolean;
}

/**
 * INVESTIMENTO
 */
export interface Investment extends BaseEntity {
  userId: string;
  identifier: string; // Ticker, CNPJ, código
  name?: string; // Nome do ativo
  assetType: 'stock' | 'fii' | 'etf' | 'crypto' | 'fixed_income' | 'fund' | 'bdr' | 'option' | 'future' | 'other';
  brokerId: string;
  totalQuantity: number;
  averagePrice: number; // Preço médio ponderado
  totalInvested: number; // Valor total investido
  currentPrice?: number; // Cotação atual
  currentValue?: number; // Valor atual da posição
  profitLoss?: number; // Lucro/Prejuízo atual
  profitLossPercentage?: number; // % de lucro/prejuízo
  
  // Campos relacionados a dividendos
  totalDividendsReceived?: number;
  dividendYield?: number;
  lastDividendDate?: string;
  lastDividendValue?: number;
  
  status: InvestmentStatus;
  
  // Compatibilidade com versões antigas
  quantity?: number; // Para compatibilidade
  purchasePrice?: number; // Para compatibilidade
  purchaseDate?: string; // Para compatibilidade
}

/**
 * VIAGEM
 */
export interface Trip extends BaseEntity {
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent?: number;
  currency: string;
  status: TripStatus;
  participants?: string[];
  description?: string;
  averageExchangeRate?: number;
  
  // Compatibilidade com versões antigas
  expenses?: any[]; // Para compatibilidade
}

/**
 * CONTATO
 */
export interface Contact extends BaseEntity {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  relationship?: string;
  notes?: string;
  category?: string; // Para compatibilidade
}

/**
 * CARTÃO DE CRÉDITO
 */
export interface CreditCard extends BaseEntity {
  userId: string;
  name: string;
  limit: number;
  usedAmount: number;
  dueDate: number;
  closingDate: number;
  isActive: boolean;
}

// ============================================================================
// INTERFACES DE CONFIGURAÇÃO E REGRAS
// ============================================================================

/**
 * REGRA DE RECORRÊNCIA
 */
export interface RecurringRule extends BaseEntity {
  userId: string;
  name: string;
  description?: string;
  
  // Dados da transação modelo
  amount: number;
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense';
  
  // Configurações de recorrência
  frequency: RecurringFrequency;
  interval: number; // A cada X períodos
  dayOfMonth?: number; // Para recorrência mensal
  dayOfWeek?: number; // Para recorrência semanal
  
  // Período de validade
  startDate: string;
  endDate?: string;
  
  // Controle de execução
  lastExecuted?: string;
  nextExecution: string;
  isActive: boolean;
  autoExecute: boolean;
}

/**
 * CONFIGURAÇÃO DE RECORRÊNCIA (para compatibilidade)
 */
export interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  maxOccurrences?: number;
  nextDate?: string;
}

/**
 * CONFIGURAÇÃO DE PARCELAMENTO
 */
export interface InstallmentConfig {
  installmentNumber: number;
  totalInstallments: number;
  parentTransactionId?: string;
  originalAmount?: number;
  isParent?: boolean;
}

// ============================================================================
// INTERFACES DE FORMULÁRIOS
// ============================================================================

export interface TransactionFormData {
  amount: number;
  description: string;
  categoryId: string;
  accountId: string;
  type: TransactionType;
  date: string;
  notes?: string;
  tags?: string[];
  toAccountId?: string; // Para transferências
  installments?: number;
  creditCardId?: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  currency: string;
  description?: string;
}

export interface GoalFormData {
  name: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
}

// ============================================================================
// INTERFACES DE FILTROS E CONSULTAS
// ============================================================================

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: string;
  categoryId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: TransactionStatus;
  tags?: string[];
  searchTerm?: string;
  search?: string; // Para compatibilidade
}

export interface AccountFilters {
  type?: AccountType;
  isActive?: boolean;
  search?: string;
}

export interface GoalFilters {
  isCompleted?: boolean;
  category?: string;
  status?: GoalStatus;
}

export interface InvestmentFilters {
  assetType?: string;
  status?: InvestmentStatus;
  search?: string;
}

// ============================================================================
// INTERFACES DE RESPOSTA E PAGINAÇÃO
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ============================================================================
// INTERFACES DE RESUMOS E RELATÓRIOS
// ============================================================================

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  averageTransaction: number;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

export interface AccountSummary {
  totalBalance: number;
  accountCount: number;
  accountsByType: Record<AccountType, number>;
}

export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  goalsProgress: number;
  recentTransactions: Transaction[];
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

// ============================================================================
// INTERFACES DE HOOKS E CONTEXTOS
// ============================================================================

export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createTransaction: (data: TransactionFormData) => Promise<void>;
  updateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export interface UseAccountsResult {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAccount: (data: AccountFormData) => Promise<void>;
  updateAccount: (id: string, data: Partial<AccountFormData>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createGoal: (data: GoalFormData) => Promise<void>;
  updateGoal: (id: string, data: Partial<GoalFormData>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

// ============================================================================
// INTERFACES DE AUDITORIA E SEGURANÇA
// ============================================================================

export interface AuditEntry {
  id: string;
  timestamp: Date;
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id?: string;
  user_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  success: boolean;
  error_message?: string;
}

// ============================================================================
// INTERFACES DE NOTIFICAÇÕES E CONFIGURAÇÕES
// ============================================================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  language: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
}

// ============================================================================
// TIPOS DE COMPATIBILIDADE E MIGRAÇÃO
// ============================================================================

/**
 * Tipos para manter compatibilidade com código legado
 * Estes tipos devem ser gradualmente removidos conforme o código é migrado
 */

export interface LegacyTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  account: string;
  date: string;
  tags?: string[];
  type?: 'income' | 'expense' | 'transfer';
}

export interface LegacyAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  status?: 'active' | 'inactive';
  bankName?: string;
  bank?: string;
}

// ============================================================================
// EXPORTS PARA COMPATIBILIDADE
// ============================================================================

// Re-exportar tipos principais com nomes alternativos para compatibilidade
export type { Transaction as TransactionType };
export type { Account as AccountType };
export type { Goal as GoalType };
export type { Investment as InvestmentType };
export type { Trip as TripType };
export type { Contact as ContactType };

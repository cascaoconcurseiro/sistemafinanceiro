// =====================================================
// TIPOS E INTERFACES TYPESCRIPT - SISTEMA FINANCEIRO
// =====================================================

// =====================================================
// TIPOS BÁSICOS
// =====================================================

export type UUID = string;
export type Decimal = number;
export type DateString = string; // ISO date string
export type TimestampString = string; // ISO timestamp string

// =====================================================
// ENUMS
// =====================================================

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  CASH = 'cash'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum RecurringType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum BudgetPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum AlertType {
  LOW_BALANCE = 'low_balance',
  HIGH_CREDIT_USAGE = 'high_credit_usage',
  BUDGET_EXCEEDED = 'budget_exceeded',
  GOAL_DEADLINE = 'goal_deadline',
  CUSTOM = 'custom'
}

export enum AuditAction {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

// =====================================================
// INTERFACE BASE
// =====================================================

export interface BaseEntity {
  id: UUID;
  created_at: TimestampString;
  updated_at: TimestampString;
}

// =====================================================
// USUÁRIOS
// =====================================================

export interface User extends BaseEntity {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
  email_verified?: boolean;
}

export interface UserProfile {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: TimestampString;
}

// =====================================================
// CATEGORIAS
// =====================================================

export interface Category extends BaseEntity {
  user_id: UUID;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: UUID;
  is_active: boolean;
}

export interface CreateCategoryInput {
  user_id: UUID;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: UUID;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: UUID;
  is_active?: boolean;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

// =====================================================
// CONTAS BANCÁRIAS
// =====================================================

export interface Account extends BaseEntity {
  user_id: UUID;
  name: string;
  type: AccountType;
  bank_name?: string;
  account_number?: string;
  agency?: string;
  initial_balance: Decimal;
  current_balance: Decimal;
  color?: string;
  is_active: boolean;
}

export interface CreateAccountInput {
  user_id: UUID;
  name: string;
  type: AccountType;
  bank_name?: string;
  account_number?: string;
  agency?: string;
  initial_balance?: Decimal;
  color?: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  bank_name?: string;
  account_number?: string;
  agency?: string;
  initial_balance?: Decimal;
  color?: string;
  is_active?: boolean;
}

// =====================================================
// CARTÕES DE CRÉDITO
// =====================================================

export interface CreditCard extends BaseEntity {
  user_id: UUID;
  name: string;
  bank_name?: string;
  last_four_digits?: string;
  credit_limit: Decimal;
  current_balance: Decimal;
  available_limit: Decimal; // Computed field
  closing_day?: number;
  due_day?: number;
  color?: string;
  is_active: boolean;
}

export interface CreateCreditCardInput {
  user_id: UUID;
  name: string;
  bank_name?: string;
  last_four_digits?: string;
  credit_limit: Decimal;
  closing_day?: number;
  due_day?: number;
  color?: string;
}

export interface UpdateCreditCardInput {
  name?: string;
  bank_name?: string;
  last_four_digits?: string;
  credit_limit?: Decimal;
  closing_day?: number;
  due_day?: number;
  color?: string;
  is_active?: boolean;
}

// =====================================================
// TRANSAÇÕES
// =====================================================

export interface Transaction extends BaseEntity {
  user_id: UUID;
  account_id?: UUID;
  credit_card_id?: UUID;
  category_id?: UUID;
  description: string;
  amount: Decimal;
  type: TransactionType;
  transaction_date: DateString;
  transfer_to_account_id?: UUID;
  transfer_group_id?: UUID;
  notes?: string;
  tags?: string[];
  location?: string;
  receipt_url?: string;
  installment_number: number;
  total_installments: number;
  installment_group_id?: UUID;
  is_recurring: boolean;
  recurring_type?: RecurringType;
  recurring_interval: number;
  recurring_end_date?: DateString;
  recurring_group_id?: UUID;
  is_confirmed: boolean;
  is_deleted: boolean;
}

export interface CreateTransactionInput {
  user_id: UUID;
  account_id?: UUID;
  credit_card_id?: UUID;
  category_id?: UUID;
  description: string;
  amount: Decimal;
  type: TransactionType;
  transaction_date: DateString;
  transfer_to_account_id?: UUID;
  notes?: string;
  tags?: string[];
  location?: string;
  receipt_url?: string;
  total_installments?: number;
  is_recurring?: boolean;
  recurring_type?: RecurringType;
  recurring_interval?: number;
  recurring_end_date?: DateString;
}

export interface UpdateTransactionInput {
  account_id?: UUID;
  credit_card_id?: UUID;
  category_id?: UUID;
  description?: string;
  amount?: Decimal;
  type?: TransactionType;
  transaction_date?: DateString;
  transfer_to_account_id?: UUID;
  notes?: string;
  tags?: string[];
  location?: string;
  receipt_url?: string;
  is_confirmed?: boolean;
}

export interface TransactionWithDetails extends Transaction {
  user_name: string;
  account_name?: string;
  credit_card_name?: string;
  category_name?: string;
  transfer_to_account_name?: string;
}

// =====================================================
// ORÇAMENTOS
// =====================================================

export interface Budget extends BaseEntity {
  user_id: UUID;
  category_id: UUID;
  name: string;
  amount: Decimal;
  period: BudgetPeriod;
  start_date: DateString;
  end_date?: DateString;
  is_active: boolean;
}

export interface CreateBudgetInput {
  user_id: UUID;
  category_id: UUID;
  name: string;
  amount: Decimal;
  period: BudgetPeriod;
  start_date: DateString;
  end_date?: DateString;
}

export interface UpdateBudgetInput {
  category_id?: UUID;
  name?: string;
  amount?: Decimal;
  period?: BudgetPeriod;
  start_date?: DateString;
  end_date?: DateString;
  is_active?: boolean;
}

export interface BudgetWithUsage extends Budget {
  category_name: string;
  spent_amount: Decimal;
  remaining_amount: Decimal;
  usage_percentage: number;
}

// =====================================================
// METAS FINANCEIRAS
// =====================================================

export interface FinancialGoal extends BaseEntity {
  user_id: UUID;
  name: string;
  description?: string;
  target_amount: Decimal;
  current_amount: Decimal;
  target_date?: DateString;
  category?: string;
  priority: number;
  is_completed: boolean;
}

export interface CreateFinancialGoalInput {
  user_id: UUID;
  name: string;
  description?: string;
  target_amount: Decimal;
  target_date?: DateString;
  category?: string;
  priority?: number;
}

export interface UpdateFinancialGoalInput {
  name?: string;
  description?: string;
  target_amount?: Decimal;
  current_amount?: Decimal;
  target_date?: DateString;
  category?: string;
  priority?: number;
  is_completed?: boolean;
}

export interface FinancialGoalProgress extends FinancialGoal {
  progress_percentage: number;
  days_remaining?: number;
  monthly_target?: Decimal;
}

// =====================================================
// ALERTAS
// =====================================================

export interface Alert extends BaseEntity {
  user_id: UUID;
  account_id?: UUID;
  credit_card_id?: UUID;
  type: AlertType;
  title: string;
  message: string;
  threshold_value?: Decimal;
  is_active: boolean;
  is_read: boolean;
  triggered_at?: TimestampString;
}

export interface CreateAlertInput {
  user_id: UUID;
  account_id?: UUID;
  credit_card_id?: UUID;
  type: AlertType;
  title: string;
  message: string;
  threshold_value?: Decimal;
}

export interface UpdateAlertInput {
  title?: string;
  message?: string;
  threshold_value?: Decimal;
  is_active?: boolean;
  is_read?: boolean;
}

// =====================================================
// AUDITORIA
// =====================================================

export interface AuditLog extends BaseEntity {
  user_id?: UUID;
  table_name: string;
  record_id: UUID;
  action: AuditAction;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// =====================================================
// VIEWS E RELATÓRIOS
// =====================================================

export interface UserBalanceSummary {
  user_id: UUID;
  first_name: string;
  last_name: string;
  total_account_balance: Decimal;
  total_credit_card_debt: Decimal;
  net_worth: Decimal;
}

export interface MonthlyReport {
  user_id: UUID;
  month: string;
  year: number;
  total_income: Decimal;
  total_expenses: Decimal;
  net_income: Decimal;
  transactions_count: number;
  top_categories: Array<{
    category_name: string;
    amount: Decimal;
    percentage: number;
  }>;
}

export interface CategoryReport {
  category_id: UUID;
  category_name: string;
  total_amount: Decimal;
  transaction_count: number;
  average_amount: Decimal;
  percentage_of_total: number;
}

// =====================================================
// FILTROS E PAGINAÇÃO
// =====================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface TransactionFilters {
  user_id: UUID;
  account_id?: UUID;
  credit_card_id?: UUID;
  category_id?: UUID;
  type?: TransactionType;
  start_date?: DateString;
  end_date?: DateString;
  min_amount?: Decimal;
  max_amount?: Decimal;
  description?: string;
  tags?: string[];
  is_recurring?: boolean;
  is_confirmed?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// =====================================================
// RESPOSTAS DA API
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// =====================================================
// CONFIGURAÇÕES DO SISTEMA
// =====================================================

export interface SystemConfig {
  currency: string;
  date_format: string;
  decimal_places: number;
  timezone: string;
  language: string;
}

// =====================================================
// EVENTOS DO SISTEMA
// =====================================================

export interface SystemEvent {
  type: string;
  entity: string;
  entity_id: UUID;
  user_id: UUID;
  data: Record<string, any>;
  timestamp: TimestampString;
}

export interface EventSubscription {
  event_type: string;
  callback: (event: SystemEvent) => void;
}

// =====================================================
// ESTATÍSTICAS E MÉTRICAS
// =====================================================

export interface DashboardMetrics {
  user_id: UUID;
  total_accounts: number;
  total_credit_cards: number;
  total_balance: Decimal;
  total_debt: Decimal;
  net_worth: Decimal;
  monthly_income: Decimal;
  monthly_expenses: Decimal;
  monthly_savings: Decimal;
  active_goals: number;
  completed_goals: number;
  pending_alerts: number;
}

export interface AccountMetrics {
  account_id: UUID;
  balance_history: Array<{
    date: DateString;
    balance: Decimal;
  }>;
  monthly_transactions: Array<{
    month: string;
    income: Decimal;
    expenses: Decimal;
    net: Decimal;
  }>;
  top_categories: Array<{
    category_name: string;
    amount: Decimal;
    count: number;
  }>;
}

// =====================================================
// TIPOS UTILITÁRIOS
// =====================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// =====================================================
// CONSTANTES
// =====================================================

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;
export const DEFAULT_CURRENCY = 'BRL';
export const DEFAULT_DECIMAL_PLACES = 2;
export const MAX_INSTALLMENTS = 60;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_DESCRIPTION_LENGTH = 255;
export const MAX_NOTES_LENGTH = 1000;

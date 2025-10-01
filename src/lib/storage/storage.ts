import { Budget, Tag, Category } from '@/types';

import { logComponents, logError } from '../logger';
import { databaseService } from '../services/database-service';

// DEPRECATED: localStorage foi removido do sistema
// Todos os dados agora devem vir do banco de dados via databaseService
const deprecatedStorage = {
  getStorageData: (key: string) => {
    console.warn(`⚠️ getStorageData(${key}) - localStorage removido, use databaseService`);
    return null;
  },
  setStorageData: (key: string, data: any) => {
    console.warn(`⚠️ setStorageData(${key}) - localStorage removido, use databaseService`);
  },
  removeStorageData: (key: string) => {
    console.warn(`⚠️ removeStorageData(${key}) - localStorage removido, use databaseService`);
  }
};
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'shared';
  category: string;
  account: string;
  date: string;
  installments?: number;
  currentInstallment?: number;
  recurring?: boolean;
  notes?: string;
  sharedWith?: string[];
  myShare?: number;
  sharedPercentages?: Record<string, number>;
  tripId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  operation: 'buy' | 'sell';
  type: 'stock' | 'fii' | 'treasury' | 'cdb' | 'crypto' | 'fund';
  ticker?: string;
  name: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
  account: string;
  fees: number;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dividend {
  id: string;
  ticker: string;
  amount: number;
  date: string;
  type: 'dividend' | 'jcp' | 'bonus';
  account: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit' | 'cash';
  // balance removed - calculated dynamically from transactions
  bank?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  currency: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  participants: string[];
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  paidBy: string;
  sharedWith: string[];
  splitType: 'equal' | 'percentage' | 'amount';
  splitDetails?: Record<string, number>;
  receipt?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  account: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  usedLimit: number;
  dueDate: number;
  closingDate: number;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardTransaction {
  id: string;
  cardId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  installments?: number;
  currentInstallment?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextPayment: string;
  category: string;
  account: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  categoryBreakdown: Record<string, number>;
  accountBalances: Record<string, number>;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  billing: boolean;
  goal: boolean;
  investments: boolean;
  general: boolean;
}

export interface Itinerary {
  id: string;
  tripId: string;
  day: number;
  date: string;
  items: ItineraryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryItem {
  id: string;
  type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity';
  name: string;
  time: string;
  duration?: number;
  cost?: number;
  location?: string;
  notes?: string;
  order: number;
}

export interface EmergencyReserve {
  id: string;
  targetAmount: number;
  currentAmount: number;
  monthlyGoal: number;
  targetMonths: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedDebt {
  id: string;
  creditor: string; // Nome da pessoa que deve receber
  debtor: string; // Nome da pessoa que deve pagar
  originalAmount: number;
  currentAmount: number;
  description: string;
  transactionId?: string; // ID da transação relacionada
  status: 'active' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface BillingPayment {
  id: string;
  transactionId: string;
  userEmail: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  paidDate?: string;
  dueDate?: string;
  month: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  priority: 'low' | 'medium' | 'high';
  monthlyContribution: number;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'warning' | 'exceeded';
  message: string;
  percentage: number;
  createdAt: string;
  isRead: boolean;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialInsight {
  id: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_alert' | 'goal_progress';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actionText?: string;
  createdAt: string;
  isRead: boolean;
}

export interface TaxDocument {
  id: string;
  type: 'income' | 'expense' | 'investment' | 'donation';
  description: string;
  amount: number;
  date: string;
  category: string;
  documentUrl?: string;
  taxYear: number;
  isDeductible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSnapshot {
  id: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  investmentValue: number;
  emergencyFundMonths: number;
  createdAt: string;
}

export interface BankConnection {
  id: string;
  bankName: string;
  accountType: string;
  lastSync: string;
  isActive: boolean;
  syncFrequency: 'manual' | 'daily' | 'weekly';
  credentials: {
    encrypted: boolean;
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
  billReminders: boolean;
  investmentUpdates: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface DataBackup {
  id: string;
  type: 'manual' | 'automatic';
  size: number;
  checksum: string;
  location: 'local' | 'cloud';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object';
  description?: string;
  isPublic: boolean;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  type: 'login_success' | 'login_failure' | 'password_change' | 'account_locked' | 'suspicious_activity';
  description: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface AppMetrics {
  id: string;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature_request' | 'general';
  title: string;
  description: string;
  rating?: number;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'bank' | 'investment' | 'payment' | 'accounting';
  provider: string;
  isEnabled: boolean;
  configuration: Record<string, any>;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastDelivery?: string;
  deliveryStatus?: 'success' | 'failed';
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RateLimit {
  id: string;
  identifier: string;
  endpoint: string;
  requests: number;
  windowStart: string;
  windowEnd: string;
  limit: number;
  remaining: number;
}

export interface CacheEntry {
  id: string;
  key: string;
  value: any;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  lastAccessed: string;
}

export interface QueueJob {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  createdAt: string;
}

export interface HealthCheck {
  id: string;
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  message?: string;
  checkedAt: string;
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Record<string, any>;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataMigration {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  rollbackAvailable: boolean;
  createdAt: string;
}

export interface PerformanceMetric {
  id: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    name: string;
    weight: number;
    configuration: Record<string, any>;
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  targetAudience?: Record<string, any>;
  metrics: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'chart' | 'table';
  title?: string;
  content: any;
  position: number;
  isVisible: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; w: number; h: number };
    configuration: Record<string, any>;
  }>;
  isDefault: boolean;
  isPublic: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: string;
  name: string;
  description?: string;
  configuration: Record<string, any>;
  dataSource: string;
  refreshInterval?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  connectionString: string;
  configuration: Record<string, any>;
  isActive: boolean;
  lastSync?: string;
  syncStatus?: 'success' | 'error' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'financial' | 'analytics' | 'operational';
  template: Record<string, any>;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  schedule: string; // cron expression
  parameters: Record<string, any>;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  category: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface FileUpload {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  uploadedBy: string;
  isPublic: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  content: string;
  parentId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileId: string;
  name: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
    permissions: string[];
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  teamId?: string;
  ownerId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  projectId?: string;
  parentId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isRunning: boolean;
  billable: boolean;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  description?: string;
  type: 'fixed' | 'hourly' | 'retainer';
  value: number;
  currency: string;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  terms?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  projectId?: string;
  clientId?: string;
  receiptUrl?: string;
  isReimbursable: boolean;
  isReimbursed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal' | 'stripe' | 'other';
  name: string;
  details: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  planId: string;
  userId: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  subscriptionId: string;
  metric: string;
  quantity: number;
  timestamp: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  currency?: string;
  maxRedemptions?: number;
  redemptions: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  couponId: string;
  subscriptionId?: string;
  invoiceId?: string;
  amount: number;
  appliedAt: string;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  jurisdiction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping' | 'business';
  name?: string;
  company?: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  estimatedDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod?: ShippingMethod;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  images: string[];
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
  };
  dimensions?: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  slug: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  locationId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  locationId?: string;
  userId: string;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'office';
  address: Address;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  purchaseOrderId?: string;
  supplierId: string;
  receiptDate: string;
  items: Array<{
    productId: string;
    quantityOrdered: number;
    quantityReceived: number;
    condition: 'good' | 'damaged' | 'defective';
  }>;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  threshold: number;
  currentQuantity: number;
  isActive: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface Barcode {
  id: string;
  productId: string;
  type: 'UPC' | 'EAN' | 'CODE128' | 'QR';
  value: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  reason?: string;
  changedBy: string;
  effectiveDate: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  value: number;
  conditions: Record<string, any>;
  applicableProducts: string[];
  applicableCategories: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  isApproved: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  customerId: string;
  name: string;
  isPublic: boolean;
  items: Array<{
    productId: string;
    addedAt: string;
    priority: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  customerId?: string;
  sessionId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    addedAt: string;
  }>;
  subtotal: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checkout {
  id: string;
  cartId: string;
  customerId?: string;
  email: string;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethodId: string;
  paymentMethodId: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'abandoned' | 'failed';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'processed' | 'refunded';
  items: Array<{
    productId: string;
    quantity: number;
    reason: string;
    condition: 'new' | 'used' | 'damaged' | 'defective';
  }>;
  refundAmount: number;
  restockingFee: number;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exchange {
  id: string;
  returnId: string;
  newItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  priceDifference: number;
  status: 'pending' | 'approved' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface GiftCard {
  id: string;
  code: string;
  initialValue: number;
  currentValue: number;
  currency: string;
  issuedTo?: string;
  issuedBy: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  type: 'issued' | 'redeemed' | 'refunded';
  amount: number;
  orderId?: string;
  description?: string;
  createdAt: string;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  pointsPerDollar: number;
  currency: string;
  tiers: Array<{
    name: string;
    minPoints: number;
    benefits: string[];
    multiplier: number;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyAccount {
  id: string;
  customerId: string;
  programId: string;
  points: number;
  tier: string;
  joinedAt: string;
  lastActivity: string;
}

export interface PointsTransaction {
  id: string;
  accountId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  orderId?: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  programId: string;
  name: string;
  description?: string;
  type: 'discount' | 'free_product' | 'free_shipping' | 'cash_back';
  value: number;
  pointsCost: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  accountId: string;
  rewardId: string;
  pointsUsed: number;
  orderId?: string;
  status: 'pending' | 'applied' | 'expired' | 'cancelled';
  redeemedAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'social' | 'display';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  targetAudience: Record<string, any>;
  content: Record<string, any>;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  budget?: number;
  spent?: number;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSend {
  id: string;
  templateId?: string;
  campaignId?: string;
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  complainedAt?: string;
  failedAt?: string;
  error?: string;
  createdAt: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SMSSend {
  id: string;
  templateId?: string;
  campaignId?: string;
  to: string;
  content: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  error?: string;
  createdAt: string;
}

export interface PushNotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PushNotificationSend {
  id: string;
  templateId?: string;
  campaignId?: string;
  deviceToken: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  clickedAt?: string;
  failedAt?: string;
  error?: string;
  createdAt: string;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  conditions: Record<string, any>;
  customerCount: number;
  lastCalculated: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSegment {
  id: string;
  customerId: string;
  segmentId: string;
  addedAt: string;
  removedAt?: string;
}

export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  notes?: string;
  assignedTo?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'email_opened' | 'link_clicked' | 'form_submitted' | 'page_visited' | 'call_made' | 'meeting_scheduled';
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SalesOpportunity {
  id: string;
  leadId?: string;
  customerId?: string;
  name: string;
  description?: string;
  value: number;
  currency: string;
  probability: number;
  stage: string;
  source: string;
  assignedTo: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  status: 'open' | 'won' | 'lost';
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesStage {
  id: string;
  name: string;
  description?: string;
  probability: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesActivity {
  id: string;
  opportunityId: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up';
  subject: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  outcome?: string;
  nextAction?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  number: string;
  opportunityId?: string;
  customerId: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    price: number;
    discount: number;
    total: number;
  }>;
  terms?: string;
  notes?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesTarget {
  id: string;
  userId: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  year: number;
  month?: number;
  quarter?: number;
  targetRevenue: number;
  targetDeals: number;
  actualRevenue: number;
  actualDeals: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  id: string;
  userId: string;
  opportunityId?: string;
  orderId?: string;
  type: 'percentage' | 'fixed';
  rate: number;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Territory {
  id: string;
  name: string;
  description?: string;
  type: 'geographic' | 'industry' | 'account_size';
  boundaries: Record<string, any>;
  assignedTo: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTerritory {
  id: string;
  customerId: string;
  territoryId: string;
  assignedAt: string;
  assignedBy: string;
}

export interface SalesReport {
  id: string;
  type: 'pipeline' | 'forecast' | 'performance' | 'activity';
  period: string;
  filters: Record<string, any>;
  data: Record<string, any>;
  generatedBy: string;
  createdAt: string;
}

export interface SalesForecast {
  id: string;
  period: string;
  territory?: string;
  userId?: string;
  predictedRevenue: number;
  confidence: number;
  methodology: string;
  assumptions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  pricing: Record<string, any>;
  marketShare: number;
  lastUpdated: string;
  createdAt: string;
}

export interface MarketResearch {
  id: string;
  title: string;
  description?: string;
  methodology: string;
  findings: Record<string, any>;
  recommendations: string[];
  conductedBy: string;
  completedAt: string;
  createdAt: string;
}

export interface CustomerFeedback {
  id: string;
  customerId: string;
  type: 'survey' | 'review' | 'complaint' | 'suggestion';
  subject: string;
  content: string;
  rating?: number;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
    question: string;
    options?: string[];
    required: boolean;
  }>;
  status: 'draft' | 'active' | 'closed';
  targetAudience?: Record<string, any>;
  responses: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  customerId?: string;
  responses: Record<string, any>;
  completedAt: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpful: number;
  notHelpful: number;
  authorId: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  number: string;
  customerId: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  category: string;
  assignedTo?: string;
  resolution?: string;
  satisfactionRating?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface SLA {
  id: string;
  name: string;
  description?: string;
  conditions: Record<string, any>;
  targets: {
    firstResponse: number; // minutes
    resolution: number; // minutes
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SLAViolation {
  id: string;
  ticketId: string;
  slaId: string;
  type: 'first_response' | 'resolution';
  targetTime: number;
  actualTime: number;
  violationTime: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  customerId?: string;
  visitorId?: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  rating?: number;
  transcript: Array<{
    senderId: string;
    senderType: 'customer' | 'agent' | 'bot';
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface ChatBot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  flows: Array<{
    trigger: string;
    responses: string[];
    actions?: string[];
  }>;
  fallbackMessage: string;
  handoffConditions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Escalation {
  id: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  reason: string;
  notes?: string;
  escalatedAt: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface WorkSchedule {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeOff {
  id: string;
  userId: string;
  type: 'vacation' | 'sick' | 'personal' | 'holiday';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string;
  type: 'annual' | 'quarterly' | 'probationary' | 'project';
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  goals: Array<{
    description: string;
    target: string;
    achievement: string;
    rating: number;
  }>;
  overallRating: number;
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan: string[];
  comments: string;
  employeeComments?: string;
  completedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  title: string;
  description?: string;
  type: 'online' | 'classroom' | 'workshop' | 'certification';
  duration: number; // minutes
  instructor?: string;
  maxParticipants?: number;
  materials: string[];
  prerequisites: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  instructor: string;
  participants: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnrollment {
  id: string;
  sessionId: string;
  userId: string;
  status: 'enrolled' | 'completed' | 'failed' | 'withdrawn';
  enrolledAt: string;
  completedAt?: string;
  score?: number;
  certificate?: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  certifications: string[];
  lastAssessed: string;
  assessedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: 'draft' | 'active' | 'paused' | 'closed';
  applications: number;
  postedAt?: string;
  closesAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'submitted' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  source: string;
  notes?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  type: 'phone' | 'video' | 'in_person' | 'technical';
  scheduledAt: string;
  duration: number; // minutes
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  rating?: number;
  recommendation: 'hire' | 'no_hire' | 'maybe';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  position: string;
  salary: number;
  currency: string;
  startDate: string;
  benefits: string[];
  terms: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'withdrawn';
  sentAt?: string;
  responseDeadline?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  department: string;
  position: string;
  manager?: string;
  hireDate: string;
  salary: number;
  currency: string;
  status: 'active' | 'inactive' | 'terminated';
  terminationDate?: string;
  terminationReason?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  budget?: number;
  headcount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  grossPay: number;
  taxes: number;
  netPay: number;
  currency: string;
  status: 'draft' | 'processed' | 'paid';
  processedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Benefit {
  id: string;
  name: string;
  description?: string;
  type: 'health' | 'dental' | 'vision' | 'retirement' | 'life' | 'disability' | 'other';
  provider?: string;
  cost: number;
  employerContribution: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeBenefit {
  id: string;
  employeeId: string;
  benefitId: string;
  enrolledAt: string;
  status: 'active' | 'inactive' | 'pending';
  dependents: Array<{
    name: string;
    relationship: string;
    dateOfBirth: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Função auxiliar para atualizar saldo da conta após operações de transação
const updateAccountBalanceAfterTransaction = async (accountId: string, transactions: Transaction[]): Promise<void> => {
  try {
    // Calcular novo saldo baseado nas transações da conta
    const accountTransactions = transactions.filter(t => t.accountId === accountId);
    const newBalance = accountTransactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount;
    }, 0);

    // Atualizar saldo da conta via API
    const response = await fetch(`/api/accounts/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ balance: newBalance }),
    });

    if (!response.ok) {
      console.warn('Erro ao atualizar saldo da conta via API');
    } else {
      console.log('Saldo da conta atualizado:', accountId, newBalance);
    }
  } catch (error) {
    console.error('Erro ao atualizar saldo da conta:', error);
  }
};

// Storage functions - Pure CRUD operations without FinancialDataAdapter dependencies
export const storage = {
  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      if (typeof window === 'undefined') return [];
      
      // Usar API route ao invés de chamada direta ao DatabaseService
      const response = await fetch('/api/transactions');
      if (response.ok) {
        return await response.json();
      }
      
      console.warn('Erro ao buscar transações via API, usando fallback');
      return [];
    } catch (error) {
      logError.storage('Error loading transactions:', error);
      return [];
    }
  },

  saveTransactions: async (transactions: Transaction[]): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        // Usar API route ao invés de chamada direta ao DatabaseService
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transactions }),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar transações via API');
        }
        
        console.log('Transações salvas via API:', transactions.length);
      }
    } catch (error) {
      logError.storage('Error saving transactions:', error);
    }
  },

  addTransaction: async (transaction: Transaction): Promise<Transaction> => {
    try {
      if (typeof window === 'undefined') throw new Error('Window not available');
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar transação via API');
      }
      
      const savedTransaction = await response.json();
      console.log('Transação adicionada via API:', savedTransaction.id);
      return savedTransaction;
    } catch (error) {
      logError.storage('Error adding transaction:', error);
      throw error;
    }
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
    try {
      if (typeof window === 'undefined') throw new Error('Window not available');
      
      // Buscar transação original para comparar mudanças que afetam o saldo
      const originalTransactions = deprecatedStorage.getStorageData<Transaction>('transactions') || [];
      const originalTransaction = originalTransactions.find(t => t.id === id);
      
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar transação via API');
      }
      
      const updatedTransaction = await response.json();
      
      // Verificar se houve mudanças que afetam o saldo (amount, type, ou accountId)
      if (originalTransaction && (
        updates.amount !== undefined || 
        updates.type !== undefined || 
        updates.accountId !== undefined
      )) {
        // Atualizar transações locais
        const updatedTransactions = originalTransactions.map(t => 
          t.id === id ? updatedTransaction : t
        );
        deprecatedStorage.setStorageData('transactions', updatedTransactions);
        
        // Atualizar saldo da conta original se mudou de conta
        if (updates.accountId && originalTransaction.accountId !== updates.accountId) {
          await updateAccountBalanceAfterTransaction(originalTransaction.accountId, updatedTransactions);
        }
        
        // Atualizar saldo da conta atual
        const accountId = updates.accountId || originalTransaction.accountId;
        await updateAccountBalanceAfterTransaction(accountId, updatedTransactions);
      }
      
      console.log('Transação atualizada via API e saldo da conta atualizado:', updatedTransaction.id);
      return updatedTransaction;
    } catch (error) {
      logError.storage('Error updating transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: string): Promise<boolean> => {
    try {
      // Implementação local para evitar recursão infinita
      const transactions = deprecatedStorage.getStorageData<Transaction>('transactions') || [];
      const transactionToDelete = transactions.find(t => t.id === id);
      
      if (!transactionToDelete) {
        console.warn('Transação não encontrada para exclusão:', id);
        return false;
      }

      const filteredTransactions = transactions.filter(t => t.id !== id);

      // Salvar transações filtradas
      deprecatedStorage.setStorageData('transactions', filteredTransactions);
      
      // Atualizar saldo da conta afetada
      await updateAccountBalanceAfterTransaction(transactionToDelete.accountId, filteredTransactions);
      
      console.log('Transação deletada localmente e saldo da conta atualizado:', id);
      return true;
    } catch (error) {
      logError.storage('Error deleting transaction:', error);
      throw error;
    }
  },

  // Accounts
  getAccounts: async (): Promise<Account[]> => {
    try {
      if (typeof window === 'undefined') return [];
      
      // Usar API route ao invés de chamada direta ao DatabaseService
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const accounts = await response.json();
        console.log('Contas carregadas via API:', accounts.length);
        return accounts;
      }
      
      console.warn('Erro ao buscar contas via API');
      return [];
    } catch (error) {
      logError.storage('Error loading accounts:', error);
      return [];
    }
  },

  saveAccounts: async (accounts: Account[]): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        // Salvar via API route
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accounts }),
        });
        
        if (response.ok) {
          console.log('Contas salvas via API:', accounts.length);
        } else {
          console.warn('Erro ao salvar contas via API');
        }
      }
    } catch (error) {
      logError.storage('Error saving accounts:', error);
    }
  },

  // Categories
  getCategories: (): Category[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-categories') || [];
    } catch (error) {
      logError.storage('Error loading categories:', error);
      return [];
    }
  },

  saveCategories: (categories: Category[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-categories', categories);
      }
    } catch (error) {
      logError.storage('Error saving categories:', error);
    }
  },

  // Budgets
  getBudgets: (): Budget[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-budgets') || [];
    } catch (error) {
      logError.storage('Error loading budgets:', error);
      return [];
    }
  },

  saveBudgets: (budgets: Budget[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-budgets', budgets);
      }
    } catch (error) {
      logError.storage('Error saving budgets:', error);
    }
  },

  // Goals
  getGoals: async (): Promise<Goal[]> => {
    try {
      if (typeof window === 'undefined') return [];
      
      // Usar API route ao invés de chamada direta ao DatabaseService
      const response = await fetch('/api/goals');
      if (response.ok) {
        return await response.json();
      }
      
      console.warn('Erro ao buscar metas via API, usando fallback');
      return [];
    } catch (error) {
      logError.storage('Error loading goals:', error);
      return [];
    }
  },

  saveGoals: async (goals: Goal[]): Promise<void> => {
    try {
      if (typeof window !== 'undefined') {
        // Usar API route ao invés de chamada direta ao DatabaseService
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goals }),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar metas via API');
        }
        
        console.log('Metas salvas via API:', goals.length);
      }
    } catch (error) {
      logError.storage('Error saving goals:', error);
    }
  },

  // Investments
  getInvestments: (): Investment[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-investments') || [];
    } catch (error) {
      logError.storage('Error loading investments:', error);
      return [];
    }
  },

  saveInvestments: (investments: Investment[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-investments', investments);
      }
    } catch (error) {
      logError.storage('Error saving investments:', error);
    }
  },

  // Dividends
  getDividends: (): Dividend[] => {
    try {
      return deprecatedStorage.getStorageData('dividends') || [];
    } catch (error) {
      logError.storage('Error loading dividends:', error);
      return [];
    }
  },

  saveDividends: (dividends: Dividend[]): void => {
    try {
      deprecatedStorage.setStorageData('dividends', dividends);
    } catch (error) {
      logError.storage('Error saving dividends:', error);
    }
  },

  // Trips
  getTrips: (): Trip[] => {
    try {
      return deprecatedStorage.getStorageData('sua-grana-trips') || [];
    } catch (error) {
      logError.storage('Error loading trips:', error);
      return [];
    }
  },

  saveTrips: (trips: Trip[]): void => {
    try {
      deprecatedStorage.setStorageData('sua-grana-trips', trips);
    } catch (error) {
      logError.storage('Error saving trips:', error);
    }
  },

  saveTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Trip => {
    try {
      const trips = storage.getTrips();
      const newTrip: Trip = {
        ...trip,
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      trips.push(newTrip);
      storage.saveTrips(trips);
      return newTrip;
    } catch (error) {
      logError.storage('Error saving trip:', error);
      throw error;
    }
  },

  updateTrip: (id: string, updates: Partial<Trip>): void => {
    try {
      if (typeof window === 'undefined') return;
      
      if (!id || typeof id !== 'string') {
        logError.storage('Invalid trip ID provided to updateTrip');
        return;
      }

      if (!updates || typeof updates !== 'object') {
        logError.storage('Invalid updates provided to updateTrip');
        return;
      }

      const trips = storage.getTrips();
      const index = trips.findIndex((t) => t && t.id === id);
      
      if (index !== -1) {
        // Validate participants if provided
        if (updates.participants && !Array.isArray(updates.participants)) {
          logError.storage('Participants must be an array');
          return;
        }

        // Update the trip
        trips[index] = {
          ...trips[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        storage.saveTrips(trips);
      } else {
        logComponents.warn(`Trip with ID ${id} not found`);
      }
    } catch (error) {
      logError.storage('Error updating trip:', error);
    }
  },

  deleteTrip: (id: string): void => {
    try {
      const trips = storage.getTrips().filter((t) => t.id !== id);
      storage.saveTrips(trips);
    } catch (error) {
      logError.storage('Error deleting trip:', error);
    }
  },

  // Trip Expenses
  getTripExpenses: (): TripExpense[] => {
    try {
      return deprecatedStorage.getStorageData('tripExpenses') || [];
    } catch (error) {
      logError.storage('Error loading trip expenses:', error);
      return [];
    }
  },

  saveTripExpenses: (expenses: TripExpense[]): void => {
    try {
      deprecatedStorage.setStorageData('tripExpenses', expenses);
    } catch (error) {
      logError.storage('Error saving trip expenses:', error);
    }
  },

  // Contacts
  getContacts: (): Contact[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-contacts') || [];
    } catch (error) {
      logError.storage('Error loading contacts:', error);
      return [];
    }
  },

  saveContacts: (contacts: Contact[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-contacts', contacts);
      }
    } catch (error) {
      logError.storage('Error saving contacts:', error);
    }
  },

  // Bills
  getBills: (): Bill[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-bills') || [];
    } catch (error) {
      logError.storage('Error loading bills:', error);
      return [];
    }
  },

  saveBills: (bills: Bill[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-bills', bills);
      }
    } catch (error) {
      logError.storage('Error saving bills:', error);
    }
  },

  // Credit Cards
  getCreditCards: (): CreditCard[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-credit-cards') || [];
    } catch (error) {
      logError.storage('Error loading credit cards:', error);
      return [];
    }
  },

  saveCreditCards: (cards: CreditCard[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-credit-cards', cards);
      }
    } catch (error) {
      logError.storage('Error saving credit cards:', error);
    }
  },

  // Credit Card Transactions
  getCreditCardTransactions: (): CreditCardTransaction[] => {
    try {
      // TODO: Implementar no databaseService quando modelo CreditCardTransaction estiver no schema
      console.warn('getCreditCardTransactions - localStorage removido, use database service');
      return [];
    } catch (error) {
      logError.storage('Error loading credit card transactions:', error);
      return [];
    }
  },

  saveCreditCardTransactions: (transactions: CreditCardTransaction[]): void => {
    try {
      deprecatedStorage.setStorageData('creditCardTransactions', transactions);
    } catch (error) {
      logError.storage('Error saving credit card transactions:', error);
    }
  },

  // Subscriptions
  getSubscriptions: (): Subscription[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-subscriptions') || [];
    } catch (error) {
      logError.storage('Error loading subscriptions:', error);
      return [];
    }
  },

  saveSubscriptions: (subscriptions: Subscription[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-subscriptions', subscriptions);
      }
    } catch (error) {
      logError.storage('Error saving subscriptions:', error);
    }
  },

  // Tags
  getTags: (): Tag[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-tags') || [];
    } catch (error) {
      logError.storage('Error loading tags:', error);
      return [];
    }
  },

  saveTags: (tags: Tag[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-tags', tags);
      }
    } catch (error) {
      logError.storage('Error saving tags:', error);
    }
  },

  // Shared Debts
  getSharedDebts: (): SharedDebt[] => {
    try {
      return deprecatedStorage.getStorageData('sharedDebts') || [];
    } catch (error) {
      logError.storage('Error loading shared debts:', error);
      return [];
    }
  },

  saveSharedDebts: (debts: SharedDebt[]): void => {
    try {
      deprecatedStorage.setStorageData('sharedDebts', debts);
    } catch (error) {
      logError.storage('Error saving shared debts:', error);
    }
  },

  // Billing Payments functions
  getBillingPayments: (): BillingPayment[] => {
    try {
      return deprecatedStorage.getStorageData('billingPayments') || [];
    } catch (error) {
      logError.storage('Error loading billing payments:', error);
      return [];
    }
  },

  saveBillingPayments: (payments: BillingPayment[]): void => {
    try {
      deprecatedStorage.setStorageData('billingPayments', payments);
    } catch (error) {
      logError.storage('Error saving billing payments:', error);
    }
  },

  updateBillingPayment: (id: string, updates: Partial<BillingPayment>): void => {
    try {
      const payments = storage.getBillingPayments();
      const index = payments.findIndex(p => p.id === id);
      if (index !== -1) {
        payments[index] = { ...payments[index], ...updates, updatedAt: new Date().toISOString() };
        storage.saveBillingPayments(payments);
      }
    } catch (error) {
      logError.storage('Error updating billing payment:', error);
    }
  },

  createBillingPayments: (transaction: Transaction): void => {
    try {
      if (transaction.type === 'shared' && transaction.sharedWith && transaction.sharedWith.length > 0) {
        const payments = storage.getBillingPayments();
        const date = new Date(transaction.date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        transaction.sharedWith.forEach(userEmail => {
          const shareAmount = transaction.sharedPercentages?.[userEmail] 
            ? (transaction.amount * transaction.sharedPercentages[userEmail]) / 100
            : transaction.amount / (transaction.sharedWith!.length + 1); // +1 for the payer
          
          const payment: BillingPayment = {
            id: `${transaction.id}-${userEmail}`,
            transactionId: transaction.id,
            userEmail,
            amount: shareAmount,
            description: transaction.description,
            date: transaction.date,
            category: transaction.category,
            isPaid: false,
            month,
            year: date.getFullYear(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          payments.push(payment);
        });
        
        storage.saveBillingPayments(payments);
      }
    } catch (error) {
      logError.storage('Error creating billing payments:', error);
    }
  },

  // Emergency Reserve
  getEmergencyReserve: (): EmergencyReserve | null => {
    try {
      return deprecatedStorage.getStorageData('emergencyReserve') || null;
    } catch (error) {
      logError.storage('Error loading emergency reserve:', error);
      return null;
    }
  },

  saveEmergencyReserve: (reserve: EmergencyReserve): void => {
    try {
      deprecatedStorage.setStorageData('emergencyReserve', reserve);
    } catch (error) {
      logError.storage('Error saving emergency reserve:', error);
    }
  },

  // Financial Goals
  getFinancialGoals: (): FinancialGoal[] => {
    try {
      if (typeof window === 'undefined') return [];
      return deprecatedStorage.getStorageData('sua-grana-financial-goals') || [];
    } catch (error) {
      logError.storage('Error loading financial goals:', error);
      return [];
    }
  },

  saveFinancialGoals: (goals: FinancialGoal[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-financial-goals', goals);
      }
    } catch (error) {
      logError.storage('Error saving financial goals:', error);
    }
  },

  // Recurring Transactions
  getRecurringTransactions: (): RecurringTransaction[] => {
    try {
      if (typeof window === 'undefined') return [];
      // TODO: Implementar no databaseService quando modelo RecurringTransaction estiver no schema
      console.warn('getRecurringTransactions - localStorage removido, use database service');
      return [];
    } catch (error) {
      logError.storage('Error loading recurring transactions:', error);
      return [];
    }
  },

  saveRecurringTransactions: (transactions: RecurringTransaction[]): void => {
    try {
      if (typeof window !== 'undefined') {
        deprecatedStorage.setStorageData('sua-grana-recurring-transactions', transactions);
      }
    } catch (error) {
      logError.storage('Error saving recurring transactions:', error);
    }
  },

  // Generate monthly bills
  generateMonthlyBills: (month: string, year: number): Bill[] => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return [];
      }
      
      const bills: Bill[] = deprecatedStorage.getStorageData('bills') || [];
      const recurringBills = bills.filter(bill => bill.isRecurring);
      
      return recurringBills.map(bill => ({
        ...bill,
        id: `${bill.id}-${year}-${month}`,
        dueDate: `${year}-${month.padStart(2, '0')}-${new Date(bill.dueDate).getDate().toString().padStart(2, '0')}`,
        isPaid: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      logError.storage('Error generating monthly bills:', error);
      return [];
    }
  },

  // Clear all data
  clearAll: (): void => {
    try {
      const keys = [
        'transactions', 'accounts', 'categories', 'budgets', 'goals',
        'investments', 'dividends', 'trips', 'tripExpenses', 'contacts',
        'bills', 'creditCards', 'creditCardTransactions', 'subscriptions',
        'tags', 'sharedDebts', 'emergencyReserve', 'financialGoals',
        'recurringTransactions'
      ];
      keys.forEach(key => deprecatedStorage.removeStorageData(key));
    } catch (error) {
      logError.storage('Error clearing storage:', error);
    }
  }
};

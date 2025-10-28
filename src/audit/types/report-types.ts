/**
 * Tipos para relatórios específicos de cada módulo de auditoria
 */

import { Issue, Recommendation } from './issue-types';

export interface SecurityReport {
  authenticationStatus: 'SECURE' | 'VULNERABLE' | 'CRITICAL';
  passwordCompliance: boolean;
  dataIsolationScore: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  nextAuthSecretConfigured: boolean;
  apiEndpointsProtected: number; // percentage
  dataLeakageDetected: boolean;
  recommendations: SecurityRecommendation[];
  score: number; // 0-100
}

export interface CodeQualityReport {
  schemaIssues: SchemaIssue[];
  duplicatedCode: CodeDuplication[];
  sqlErrors: SQLError[];
  testAPIsInProduction: string[];
  namingInconsistencies: NamingIssue[];
  qualityScore: number; // 0-100
  technicalDebt: TechnicalDebtMetric[];
  maintainabilityIndex: number;
}

export interface PerformanceReport {
  apiEfficiency: number; // 0-100
  renderOptimization: number; // 0-100
  queryPerformance: number; // 0-100
  memoryUsage: MemoryUsageMetrics;
  unnecessaryRerenders: RerenderIssue[];
  apiCallOptimizations: APIOptimization[];
  memoizationOpportunities: MemoizationOpportunity[];
  recommendations: PerformanceRecommendation[];
  score: number; // 0-100
}

export interface DataIntegrityReport {
  engineAccuracy: number; // 0-100
  calculationPrecision: number; // 0-100
  dataConsistency: number; // 0-100
  integrityViolations: IntegrityViolation[];
  financialDiscrepancies: FinancialDiscrepancy[];
  doubleEntryBalance: boolean;
  sharedExpenseAccuracy: number;
  balanceConsistency: boolean;
  score: number; // 0-100
}

export interface StressTestReport {
  maxConcurrentUsers: number;
  transactionThroughput: number; // transactions per second
  resourceLimits: ResourceLimits;
  degradationPoints: DegradationPoint[];
  stabilityScore: number; // 0-100
  performanceUnderLoad: LoadPerformanceMetrics;
  memoryLeaks: boolean;
  crashPoints: CrashPoint[];
}

export interface ExecutiveSummary {
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  readyForProduction: boolean;
  criticalIssuesCount: number;
  highPriorityIssuesCount: number;
  estimatedFixTime: number; // hours
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keyFindings: string[];
  immediateActions: string[];
}

export interface ActionPlan {
  phases: ActionPhase[];
  totalEstimatedTime: number; // hours
  priorityMatrix: PriorityMatrix;
  dependencies: TaskDependency[];
  milestones: Milestone[];
}

// Supporting interfaces
export interface SecurityVulnerability {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location: string;
  impact: string;
  solution: string;
}

export interface SecurityRecommendation extends Recommendation {
  securityImpact: string;
  complianceRequirement?: string;
}

export interface SchemaIssue {
  type: 'DUPLICATE_MODEL' | 'MISSING_RELATION' | 'INCONSISTENT_MAPPING';
  modelName: string;
  description: string;
  location: string;
  impact: string;
  solution: string;
}

export interface CodeDuplication {
  type: 'FUNCTION' | 'COMPONENT' | 'LOGIC';
  name: string;
  locations: string[];
  similarity: number; // percentage
  linesOfCode: number;
  impact: string;
}

export interface SQLError {
  query: string;
  error: string;
  location: string;
  suggestion: string;
}

export interface NamingIssue {
  type: 'SNAKE_CASE_CAMEL_CASE' | 'INCONSISTENT_NAMING';
  field: string;
  expected: string;
  actual: string;
  locations: string[];
}

export interface TechnicalDebtMetric {
  category: string;
  debt: number; // hours
  interest: number; // hours per month
  description: string;
}

export interface MemoryUsageMetrics {
  heapUsed: number; // MB
  heapTotal: number; // MB
  external: number; // MB
  rss: number; // MB
  peakUsage: number; // MB
}

export interface RerenderIssue {
  component: string;
  unnecessaryRerenders: number;
  cause: string;
  solution: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface APIOptimization {
  endpoint: string;
  currentCalls: number;
  optimizedCalls: number;
  savings: number; // percentage
  solution: string;
}

export interface MemoizationOpportunity {
  component: string;
  function: string;
  computationCost: 'LOW' | 'MEDIUM' | 'HIGH';
  frequency: number; // calls per render
  solution: string;
}

export interface PerformanceRecommendation extends Recommendation {
  performanceImpact: string;
  measurementMethod: string;
}

export interface IntegrityViolation {
  type: string;
  table: string;
  description: string;
  affectedRecords: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FinancialDiscrepancy {
  type: 'BALANCE_MISMATCH' | 'CALCULATION_ERROR' | 'ROUNDING_ERROR';
  amount: number;
  description: string;
  location: string;
  impact: string;
}

export interface ResourceLimits {
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  maxDatabaseConnections: number;
  maxResponseTime: number; // ms
}

export interface DegradationPoint {
  userCount: number;
  responseTime: number; // ms
  errorRate: number; // percentage
  description: string;
}

export interface LoadPerformanceMetrics {
  averageResponseTime: number; // ms
  p95ResponseTime: number; // ms
  p99ResponseTime: number; // ms
  errorRate: number; // percentage
  throughput: number; // requests per second
}

export interface CrashPoint {
  userCount: number;
  transactionVolume: number;
  error: string;
  stackTrace: string;
}

export interface ActionPhase {
  name: string;
  description: string;
  tasks: string[];
  estimatedTime: number; // hours
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: string[];
}

export interface PriorityMatrix {
  immediate: Issue[];
  high: Issue[];
  medium: Issue[];
  low: Issue[];
}

export interface TaskDependency {
  task: string;
  dependsOn: string[];
  blockedBy: string[];
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: Date;
  completionCriteria: string[];
}
/**
 * Tipos principais para o sistema de auditoria
 */

export interface AuditResult {
  id: string;
  timestamp: Date;
  systemVersion: string;
  auditor: string;
  overallScore: number;
  status: AuditStatus;
  
  securityReport: SecurityReport;
  codeQualityReport: CodeQualityReport;
  performanceReport: PerformanceReport;
  dataIntegrityReport: DataIntegrityReport;
  stressTestReport: StressTestReport;
  
  executiveSummary: ExecutiveSummary;
  actionPlan: ActionPlan;
  recommendations: Recommendation[];
  
  executionTime: number; // milliseconds
  issuesFound: number;
  criticalIssues: number;
}

export enum AuditStatus {
  PASS = 'PASS',
  WARNING = 'WARNING', 
  FAIL = 'FAIL',
  CRITICAL = 'CRITICAL'
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum IssueCategory {
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  QUALITY = 'QUALITY',
  INTEGRITY = 'INTEGRITY',
  STRESS = 'STRESS'
}

export enum Priority {
  IMMEDIATE = 'IMMEDIATE',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface CodeLocation {
  file: string;
  line?: number;
  function?: string;
  component?: string;
  startLine?: number;
  endLine?: number;
}

export interface AuditConfig {
  includeStressTests: boolean;
  maxConcurrentUsers: number;
  maxTransactionVolume: number;
  timeoutMs: number;
  skipKnownIssues: boolean;
  outputFormat: 'json' | 'html' | 'pdf';
  verboseLogging: boolean;
}

export interface AuditProgress {
  currentModule: string;
  completedModules: string[];
  totalModules: number;
  currentTask: string;
  progressPercentage: number;
  estimatedTimeRemaining: number; // milliseconds
}
/**
 * Sistema de Auditoria e Consistência de Dados
 * Tipos TypeScript centralizados para garantir que o banco PostgreSQL/Neon seja a única fonte de verdade
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

export type AuditOperationType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE';
export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConsistencyStatus = 'CONSISTENT' | 'INCONSISTENT' | 'WARNING' | 'ERROR';
export type SecurityThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportFormat = 'JSON' | 'PDF' | 'HTML' | 'CSV';
export type TestStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';

// ============================================================================
// INTERFACES DE AUDITORIA
// ============================================================================

export interface AuditEntry {
  id: string;
  timestamp: Date;
  operation: AuditOperationType;
  table_name: string;
  record_id?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  severity: AuditSeverity;
  success: boolean;
  error_message?: string;
  execution_time_ms: number;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  operation?: string;
  table?: string;
  recordId?: string;
}

export interface AuditContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  operation: AuditOperationType;
  tableName: string;
  recordId?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// INTERFACES DE CONSISTÊNCIA
// ============================================================================

export interface ConsistencyCheck {
  id: string;
  name: string;
  description: string;
  test_type: 'REFERENTIAL_INTEGRITY' | 'BALANCE_VALIDATION' | 'ORPHAN_RECORDS' | 'DATA_COMPLETENESS' | 'BUSINESS_RULES' | 'DUPLICATES' | 'TEMPORAL_CONSISTENCY';
  status: TestStatus;
  last_run: Date;
  next_run?: Date;
  execution_time_ms: number;
  records_checked: number;
  violations_found: number;
  details?: Record<string, any>;
}

export interface DataIntegrityViolation {
  id: string;
  check_id: string;
  violation_type: string;
  severity: AuditSeverity;
  table_name: string;
  record_id?: string;
  field_name?: string;
  expected_value?: any;
  actual_value?: any;
  description: string;
  detected_at: Date;
  resolved: boolean;
  resolved_at?: Date;
  resolution_notes?: string;
}

export interface ConsistencyTestResult {
  testName: string;
  status: TestStatus;
  executionTime: number;
  recordsChecked: number;
  violationsFound: number;
  details: {
    description: string;
    violations: DataIntegrityViolation[];
    recommendations: string[];
    severity: AuditSeverity;
  };
}

export interface DataSnapshot {
  id: string;
  timestamp: Date;
  snapshot_type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  tables_included: string[];
  total_records: number;
  checksum: string;
  size_bytes: number;
  metadata: {
    version: string;
    created_by: string;
    description?: string;
    tags?: string[];
  };
}

export interface ConsistencyReport {
  id: string;
  generated_at: Date;
  period_start: Date;
  period_end: Date;
  overall_status: ConsistencyStatus;
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  violations_found: number;
  critical_violations: number;
  execution_time_ms: number;
  test_results: ConsistencyTestResult[];
  summary: {
    health_score: number; // 0-100
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    recommendations: string[];
  };
}

// ============================================================================
// INTERFACES DE SEGURANÇA
// ============================================================================

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  event_type: 'UNAUTHORIZED_ACCESS' | 'BYPASS_ATTEMPT' | 'SUSPICIOUS_QUERY' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_CREDENTIALS' | 'DATA_EXFILTRATION';
  threat_level: SecurityThreatLevel;
  source_ip: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  blocked: boolean;
  details: {
    attempted_operation: string;
    target_table?: string;
    query?: string;
    reason: string;
    additional_info?: Record<string, any>;
  };
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'IP_WHITELIST' | 'RATE_LIMIT' | 'OPERATION_RESTRICTION' | 'TIME_BASED' | 'USER_BASED';
  enabled: boolean;
  priority: number;
  conditions: Record<string, any>;
  actions: ('BLOCK' | 'ALERT' | 'LOG' | 'THROTTLE')[];
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// INTERFACES DE RELATÓRIOS
// ============================================================================

export interface AuditReportConfig {
  id: string;
  name: string;
  description: string;
  report_type: 'AUDIT_TRAIL' | 'CONSISTENCY_ANALYSIS' | 'SECURITY_SUMMARY' | 'PERFORMANCE_METRICS' | 'EXECUTIVE_SUMMARY';
  format: ReportFormat;
  schedule?: {
    frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    time?: string; // HH:MM format
    day_of_week?: number; // 0-6, Sunday = 0
    day_of_month?: number; // 1-31
  };
  filters: {
    date_range?: {
      start: Date;
      end: Date;
    };
    severity?: AuditSeverity[];
    operations?: AuditOperationType[];
    tables?: string[];
    users?: string[];
  };
  recipients: string[]; // email addresses
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditReport {
  id: string;
  config_id: string;
  generated_at: Date;
  period_start: Date;
  period_end: Date;
  format: ReportFormat;
  file_path?: string;
  file_size_bytes?: number;
  executive_summary: ExecutiveSummary;
  audit_trail: AuditTrailSection;
  consistency_analysis: ConsistencyAnalysisSection;
  security_analysis: SecurityAnalysisSection;
  performance_metrics: PerformanceMetricsSection;
  recommendations: RecommendationsSection;
  metadata: {
    version: string;
    generated_by: string;
    total_pages?: number;
    charts_included: number;
  };
}

export interface ExecutiveSummary {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  security_incidents: number;
  consistency_violations: number;
  system_health_score: number; // 0-100
  key_metrics: {
    avg_response_time_ms: number;
    peak_operations_per_hour: number;
    data_integrity_score: number; // 0-100
    security_score: number; // 0-100
  };
  trends: {
    operations_trend: 'UP' | 'DOWN' | 'STABLE';
    performance_trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
    security_trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  };
}

export interface AuditTrailSection {
  total_entries: number;
  entries_by_operation: Record<AuditOperationType, number>;
  entries_by_severity: Record<AuditSeverity, number>;
  entries_by_table: Record<string, number>;
  top_users: Array<{
    user_id: string;
    operation_count: number;
    last_activity: Date;
  }>;
  recent_activities: AuditEntry[];
  suspicious_activities: AuditEntry[];
}

export interface ConsistencyAnalysisSection {
  overall_status: ConsistencyStatus;
  tests_summary: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    warning_tests: number;
  };
  violations_by_type: Record<string, number>;
  violations_by_severity: Record<AuditSeverity, number>;
  critical_violations: DataIntegrityViolation[];
  consistency_trends: Array<{
    date: Date;
    health_score: number;
    violations_count: number;
  }>;
}

export interface SecurityAnalysisSection {
  threat_level: SecurityThreatLevel;
  total_security_events: number;
  events_by_type: Record<string, number>;
  blocked_attempts: number;
  top_threat_sources: Array<{
    ip_address: string;
    event_count: number;
    threat_level: SecurityThreatLevel;
    last_seen: Date;
  }>;
  security_rules_triggered: Array<{
    rule_id: string;
    rule_name: string;
    trigger_count: number;
  }>;
  recent_security_events: SecurityEvent[];
}

export interface PerformanceMetricsSection {
  avg_query_time_ms: number;
  slowest_operations: Array<{
    operation: AuditOperationType;
    table: string;
    avg_time_ms: number;
    max_time_ms: number;
    count: number;
  }>;
  operations_per_hour: Array<{
    hour: Date;
    count: number;
    avg_response_time_ms: number;
  }>;
  database_metrics: {
    connection_pool_usage: number; // percentage
    active_connections: number;
    max_connections: number;
    cache_hit_ratio: number; // percentage
  };
}

export interface RecommendationsSection {
  priority_actions: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'SECURITY' | 'PERFORMANCE' | 'CONSISTENCY' | 'MAINTENANCE';
    title: string;
    description: string;
    estimated_impact: string;
    implementation_effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  optimization_suggestions: string[];
  security_improvements: string[];
  maintenance_tasks: string[];
}

// ============================================================================
// INTERFACES DE DASHBOARD
// ============================================================================

export interface DashboardData {
  timestamp: Date;
  system_health: {
    overall_score: number; // 0-100
    database_status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    audit_system_status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
    last_consistency_check: Date;
  };
  real_time_metrics: {
    active_connections: number;
    operations_per_minute: number;
    avg_response_time_ms: number;
    error_rate_percentage: number;
  };
  recent_activities: {
    total_operations_last_hour: number;
    failed_operations_last_hour: number;
    security_events_last_hour: number;
    consistency_violations_last_hour: number;
  };
  alerts: Array<{
    id: string;
    type: 'SECURITY' | 'CONSISTENCY' | 'PERFORMANCE' | 'SYSTEM';
    severity: AuditSeverity;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>;
  charts_data: {
    operations_timeline: Array<{
      timestamp: Date;
      operations_count: number;
      success_rate: number;
    }>;
    consistency_trends: Array<{
      date: Date;
      health_score: number;
      violations_count: number;
    }>;
    security_events_timeline: Array<{
      timestamp: Date;
      events_count: number;
      threat_level: SecurityThreatLevel;
    }>;
  };
}

// ============================================================================
// INTERFACES DE CONFIGURAÇÃO
// ============================================================================

export interface AuditSystemConfig {
  database: {
    connection_string: string;
    max_connections: number;
    query_timeout_ms: number;
    retry_attempts: number;
  };
  audit: {
    enabled: boolean;
    log_level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    retention_days: number;
    batch_size: number;
    flush_interval_ms: number;
  };
  consistency: {
    enabled: boolean;
    check_interval_minutes: number;
    parallel_checks: number;
    snapshot_retention_days: number;
  };
  security: {
    enabled: boolean;
    rate_limit_requests_per_minute: number;
    ip_whitelist: string[];
    block_suspicious_queries: boolean;
    alert_threshold_violations_per_hour: number;
  };
  reporting: {
    enabled: boolean;
    default_format: ReportFormat;
    storage_path: string;
    email_notifications: boolean;
    smtp_config?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
}

// ============================================================================
// INTERFACES DE SERVIÇOS
// ============================================================================

export interface IAuditService {
  initialize(): Promise<void>;
  logOperation(context: AuditContext, oldValues?: any, newValues?: any): Promise<void>;
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void>;
  getAuditTrail(filters: AuditTrailFilters): Promise<AuditEntry[]>;
  cleanup(retentionDays: number): Promise<number>;
}

export interface IConsistencyService {
  initialize(): Promise<void>;
  runConsistencyChecks(): Promise<ConsistencyReport>;
  runSpecificCheck(checkName: string): Promise<ConsistencyTestResult>;
  createSnapshot(type: DataSnapshot['snapshot_type']): Promise<DataSnapshot>;
  compareSnapshots(snapshot1Id: string, snapshot2Id: string): Promise<ConsistencyTestResult>;
  getViolations(filters: ViolationFilters): Promise<DataIntegrityViolation[]>;
}

export interface ISecurityService {
  initialize(): Promise<void>;
  validateOperation(context: AuditContext): Promise<boolean>;
  checkRateLimit(ipAddress: string, userId?: string): Promise<boolean>;
  isIpWhitelisted(ipAddress: string): Promise<boolean>;
  blockIp(ipAddress: string, reason: string, duration?: number): Promise<void>;
  getSecurityEvents(filters: SecurityEventFilters): Promise<SecurityEvent[]>;
}

export interface IReportService {
  initialize(): Promise<void>;
  generateReport(configId: string): Promise<AuditReport>;
  scheduleReport(config: AuditReportConfig): Promise<void>;
  getDashboardData(): Promise<DashboardData>;
  exportReport(reportId: string, format: ReportFormat): Promise<string>;
}

// ============================================================================
// TIPOS DE FILTROS
// ============================================================================

export interface AuditTrailFilters {
  startDate?: Date;
  endDate?: Date;
  operations?: AuditOperationType[];
  tables?: string[];
  users?: string[];
  severity?: AuditSeverity[];
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface ViolationFilters {
  startDate?: Date;
  endDate?: Date;
  severity?: AuditSeverity[];
  violationType?: string[];
  tables?: string[];
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

export interface SecurityEventFilters {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: string[];
  threatLevels?: SecurityThreatLevel[];
  sourceIps?: string[];
  blocked?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// TIPOS DE RESPOSTA DA API
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    request_id: string;
    execution_time_ms: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// ============================================================================
// TIPOS DE EVENTOS
// ============================================================================

export interface AuditSystemEvent {
  type: 'AUDIT_LOG_CREATED' | 'CONSISTENCY_CHECK_COMPLETED' | 'SECURITY_VIOLATION_DETECTED' | 'REPORT_GENERATED' | 'SYSTEM_HEALTH_CHANGED';
  timestamp: Date;
  data: any;
  source: string;
}

export type AuditSystemEventHandler = (event: AuditSystemEvent) => Promise<void> | void;

// ============================================================================
// UTILITÁRIOS
// ============================================================================

export interface DatabaseConnection {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
  transaction<T>(callback: (client: DatabaseConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface AuditSystemMetrics {
  uptime_seconds: number;
  total_operations: number;
  operations_per_second: number;
  avg_response_time_ms: number;
  error_rate_percentage: number;
  memory_usage_mb: number;
  cpu_usage_percentage: number;
  database_connections: {
    active: number;
    idle: number;
    total: number;
  };
}

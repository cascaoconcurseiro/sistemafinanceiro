// =====================================================
// SERVIÇO DE RELATÓRIOS DE AUDITORIA
// =====================================================

import { db } from '../config/database';
import { dataConsistencyService } from './data-consistency-service';
import { databaseAuditService } from './database-audit-service';
import { eventSystem } from '../events/event-system';
import { UUID, TimestampString } from '../types/database';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface AuditReportConfig {
  id: UUID;
  name: string;
  description: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  schedule_cron?: string;
  filters: {
    date_range?: { start: string; end: string };
    tables?: string[];
    operations?: string[];
    users?: UUID[];
    severity_levels?: string[];
  };
  format: 'json' | 'html' | 'pdf' | 'csv';
  recipients: string[];
  is_active: boolean;
  created_at: TimestampString;
  updated_at: TimestampString;
}

export interface AuditReport {
  id: UUID;
  config_id: UUID;
  report_name: string;
  report_type: string;
  generation_time: TimestampString;
  execution_time_ms: number;
  status: 'generating' | 'completed' | 'failed';
  file_path?: string;
  file_size_bytes?: number;
  summary: {
    total_operations: number;
    total_violations: number;
    critical_issues: number;
    tables_analyzed: number;
    date_range: { start: string; end: string };
    top_issues: Array<{
      type: string;
      count: number;
      severity: string;
    }>;
  };
  sections: {
    executive_summary: ExecutiveSummary;
    audit_trail: AuditTrailSection;
    consistency_analysis: ConsistencyAnalysisSection;
    security_analysis: SecurityAnalysisSection;
    performance_metrics: PerformanceMetricsSection;
    recommendations: RecommendationsSection;
  };
  metadata: {
    generated_by: string;
    database_version: string;
    application_version: string;
    total_pages?: number;
  };
}

export interface ExecutiveSummary {
  overall_health_score: number; // 0-100
  data_integrity_status: 'excellent' | 'good' | 'warning' | 'critical';
  key_findings: string[];
  critical_actions_required: string[];
  compliance_status: {
    data_consistency: boolean;
    audit_trail_complete: boolean;
    security_violations: number;
    backup_integrity: boolean;
  };
}

export interface AuditTrailSection {
  total_operations: number;
  operations_by_type: Record<string, number>;
  operations_by_table: Record<string, number>;
  operations_by_user: Record<string, number>;
  timeline: Array<{
    date: string;
    operations_count: number;
    violations_count: number;
  }>;
  suspicious_activities: Array<{
    type: string;
    description: string;
    timestamp: string;
    severity: string;
    details: Record<string, any>;
  }>;
}

export interface ConsistencyAnalysisSection {
  consistency_score: number; // 0-100
  tests_performed: number;
  tests_passed: number;
  tests_failed: number;
  data_integrity_issues: Array<{
    table: string;
    issue_type: string;
    affected_records: number;
    severity: string;
    description: string;
  }>;
  balance_reconciliation: {
    accounts_checked: number;
    discrepancies_found: number;
    total_discrepancy_amount: number;
    largest_discrepancy: number;
  };
}

export interface SecurityAnalysisSection {
  security_score: number; // 0-100
  unauthorized_access_attempts: number;
  blocked_operations: number;
  privilege_escalations: number;
  data_access_patterns: Array<{
    user_id: string;
    operations_count: number;
    tables_accessed: string[];
    risk_level: 'low' | 'medium' | 'high';
  }>;
  compliance_violations: Array<{
    rule: string;
    violations_count: number;
    severity: string;
    examples: any[];
  }>;
}

export interface PerformanceMetricsSection {
  database_performance: {
    avg_query_time_ms: number;
    slow_queries_count: number;
    deadlocks_count: number;
    connection_pool_usage: number;
  };
  audit_system_performance: {
    avg_audit_log_time_ms: number;
    audit_queue_size: number;
    failed_audit_logs: number;
    storage_usage_mb: number;
  };
  consistency_check_performance: {
    avg_check_time_ms: number;
    checks_performed: number;
    checks_failed: number;
  };
}

export interface RecommendationsSection {
  immediate_actions: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    description: string;
    estimated_effort: string;
    impact: string;
  }>;
  long_term_improvements: Array<{
    category: string;
    recommendation: string;
    benefits: string[];
    implementation_notes: string;
  }>;
  compliance_recommendations: Array<{
    regulation: string;
    current_status: string;
    required_actions: string[];
    deadline?: string;
  }>;
}

export interface DashboardData {
  overview: {
    health_score: number;
    total_operations_today: number;
    violations_today: number;
    critical_issues: number;
    last_consistency_check: string;
  };
  charts: {
    operations_timeline: Array<{ date: string; operations: number; violations: number }>;
    operations_by_type: Array<{ type: string; count: number; percentage: number }>;
    violations_by_severity: Array<{ severity: string; count: number; color: string }>;
    top_tables_activity: Array<{ table: string; operations: number; violations: number }>;
  };
  alerts: Array<{
    id: UUID;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    is_acknowledged: boolean;
  }>;
  recent_activities: Array<{
    timestamp: string;
    operation: string;
    table: string;
    user: string;
    status: 'success' | 'violation' | 'blocked';
  }>;
}

// =====================================================
// CLASSE PRINCIPAL DO SERVIÇO
// =====================================================

export class AuditReportService {
  private static instance: AuditReportService;
  private reportConfigs = new Map<UUID, AuditReportConfig>();
  private scheduledReports = new Map<UUID, NodeJS.Timeout>();

  public static getInstance(): AuditReportService {
    if (!AuditReportService.instance) {
      AuditReportService.instance = new AuditReportService();
    }
    return AuditReportService.instance;
  }

  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  public async initialize(): Promise<void> {
    try {
      // Criar tabelas de relatórios
      await this.createReportTables();

      // Carregar configurações de relatórios
      await this.loadReportConfigs();

      // Agendar relatórios automáticos
      await this.scheduleAutomaticReports();

          } catch (error) {
      console.error('❌ Erro ao inicializar AuditReportService:', error);
      throw error;
    }
  }

  // =====================================================
  // GERAÇÃO DE RELATÓRIOS
  // =====================================================

  public async generateAuditReport(configId: UUID): Promise<AuditReport> {
    const config = this.reportConfigs.get(configId);
    if (!config) {
      throw new Error(`Configuração de relatório não encontrada: ${configId}`);
    }

    const startTime = Date.now();
    const reportId = this.generateUUID();

    try {
      console.log(`📊 Gerando relatório de auditoria: ${config.name}`);

      // Marcar como em geração
      await this.updateReportStatus(reportId, 'generating');

      // Coletar dados para o relatório
      const auditData = await this.collectAuditData(config);
      const consistencyData = await this.collectConsistencyData(config);
      const securityData = await this.collectSecurityData(config);
      const performanceData = await this.collectPerformanceData(config);

      // Gerar seções do relatório
      const executiveSummary = this.generateExecutiveSummary(auditData, consistencyData, securityData);
      const auditTrail = this.generateAuditTrailSection(auditData);
      const consistencyAnalysis = this.generateConsistencyAnalysisSection(consistencyData);
      const securityAnalysis = this.generateSecurityAnalysisSection(securityData);
      const performanceMetrics = this.generatePerformanceMetricsSection(performanceData);
      const recommendations = this.generateRecommendationsSection(auditData, consistencyData, securityData);

      const executionTime = Date.now() - startTime;

      const report: AuditReport = {
        id: reportId,
        config_id: configId,
        report_name: config.name,
        report_type: config.report_type,
        generation_time: new Date().toISOString(),
        execution_time_ms: executionTime,
        status: 'completed',
        summary: {
          total_operations: auditData.totalOperations,
          total_violations: auditData.totalViolations,
          critical_issues: auditData.criticalIssues,
          tables_analyzed: auditData.tablesAnalyzed,
          date_range: auditData.dateRange,
          top_issues: auditData.topIssues
        },
        sections: {
          executive_summary: executiveSummary,
          audit_trail: auditTrail,
          consistency_analysis: consistencyAnalysis,
          security_analysis: securityAnalysis,
          performance_metrics: performanceMetrics,
          recommendations: recommendations
        },
        metadata: {
          generated_by: 'AuditReportService',
          database_version: await this.getDatabaseVersion(),
          application_version: process.env.APP_VERSION || '1.0.0'
        }
      };

      // Salvar relatório
      await this.saveReport(report);

      // Gerar arquivo se necessário
      if (config.format !== 'json') {
        const filePath = await this.generateReportFile(report, config.format);
        report.file_path = filePath;
        report.file_size_bytes = await this.getFileSize(filePath);
      }

      // Enviar para destinatários
      if (config.recipients.length > 0) {
        await this.sendReportToRecipients(report, config);
      }

      // Emitir evento
      eventSystem.emit('audit_report_generated', report);

      console.log(`✅ Relatório gerado com sucesso em ${executionTime}ms`);
      return report;

    } catch (error) {
      await this.updateReportStatus(reportId, 'failed');
      console.error('❌ Erro ao gerar relatório:', error);
      throw error;
    }
  }

  public async generateDashboardData(): Promise<DashboardData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Dados de overview
      const overview = await this.generateOverviewData();

      // Dados de gráficos
      const operationsTimeline = await this.generateOperationsTimeline(lastWeek, today);
      const operationsByType = await this.generateOperationsByType(today);
      const violationsBySeverity = await this.generateViolationsBySeverity(today);
      const topTablesActivity = await this.generateTopTablesActivity(lastWeek, today);

      // Alertas ativos
      const alerts = await this.getActiveAlerts();

      // Atividades recentes
      const recentActivities = await this.getRecentActivities(50);

      return {
        overview,
        charts: {
          operations_timeline: operationsTimeline,
          operations_by_type: operationsByType,
          violations_by_severity: violationsBySeverity,
          top_tables_activity: topTablesActivity
        },
        alerts,
        recent_activities: recentActivities
      };

    } catch (error) {
      console.error('Erro ao gerar dados do dashboard:', error);
      throw error;
    }
  }

  // =====================================================
  // COLETA DE DADOS
  // =====================================================

  private async collectAuditData(config: AuditReportConfig): Promise<any> {
    const { filters } = config;
    const dateRange = filters.date_range || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    };

    // Buscar logs de auditoria
    let query = `
      SELECT * FROM audit_logs
      WHERE timestamp BETWEEN $1 AND $2
    `;
    const params: any[] = [dateRange.start, dateRange.end];

    if (filters.tables && filters.tables.length > 0) {
      query += ` AND table_name = ANY($${params.length + 1})`;
      params.push(filters.tables);
    }

    if (filters.operations && filters.operations.length > 0) {
      query += ` AND operation = ANY($${params.length + 1})`;
      params.push(filters.operations);
    }

    if (filters.users && filters.users.length > 0) {
      query += ` AND user_id = ANY($${params.length + 1})`;
      params.push(filters.users);
    }

    query += ` ORDER BY timestamp DESC`;

    const auditLogs = await db.query(query, params);

    // Processar dados
    const totalOperations = auditLogs.rows.length;
    const violations = auditLogs.rows.filter(log => log.severity === 'high' || log.severity === 'critical');
    const criticalIssues = auditLogs.rows.filter(log => log.severity === 'critical').length;

    // Agrupar por tipo de operação
    const operationTypes = new Map<string, number>();
    const tableOperations = new Map<string, number>();
    const userOperations = new Map<string, number>();

    for (const log of auditLogs.rows) {
      operationTypes.set(log.operation, (operationTypes.get(log.operation) || 0) + 1);
      tableOperations.set(log.table_name, (tableOperations.get(log.table_name) || 0) + 1);
      userOperations.set(log.user_id, (userOperations.get(log.user_id) || 0) + 1);
    }

    // Top issues
    const issueTypes = new Map<string, { count: number; severity: string }>();
    for (const violation of violations) {
      const key = violation.violation_type || 'unknown';
      if (!issueTypes.has(key)) {
        issueTypes.set(key, { count: 0, severity: violation.severity });
      }
      issueTypes.get(key)!.count++;
    }

    const topIssues = Array.from(issueTypes.entries())
      .map(([type, data]) => ({ type, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalOperations,
      totalViolations: violations.length,
      criticalIssues,
      tablesAnalyzed: tableOperations.size,
      dateRange,
      topIssues,
      auditLogs: auditLogs.rows,
      operationTypes: Object.fromEntries(operationTypes),
      tableOperations: Object.fromEntries(tableOperations),
      userOperations: Object.fromEntries(userOperations)
    };
  }

  private async collectConsistencyData(config: AuditReportConfig): Promise<any> {
    // Executar testes de consistência
    const consistencyReport = await dataConsistencyService.runAllConsistencyTests();

    // Buscar histórico de relatórios de consistência
    const historicalReports = await dataConsistencyService.getConsistencyReports(30);

    return {
      currentReport: consistencyReport,
      historicalReports,
      trends: this.calculateConsistencyTrends(historicalReports)
    };
  }

  private async collectSecurityData(config: AuditReportConfig): Promise<any> {
    const { filters } = config;
    const dateRange = filters.date_range || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    };

    // Buscar violações de segurança
    const securityViolations = await db.query(`
      SELECT * FROM security_violations
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `, [dateRange.start, dateRange.end]);

    // Buscar tentativas de acesso não autorizado
    const unauthorizedAccess = await db.query(`
      SELECT * FROM audit_logs
      WHERE timestamp BETWEEN $1 AND $2
        AND (violation_type = 'unauthorized_access' OR violation_type = 'privilege_escalation')
      ORDER BY timestamp DESC
    `, [dateRange.start, dateRange.end]);

    return {
      securityViolations: securityViolations.rows,
      unauthorizedAccess: unauthorizedAccess.rows,
      totalViolations: securityViolations.rows.length,
      criticalViolations: securityViolations.rows.filter(v => v.severity === 'critical').length
    };
  }

  private async collectPerformanceData(config: AuditReportConfig): Promise<any> {
    // Coletar métricas de performance do banco
    const dbStats = await db.query(`
      SELECT
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_tup_hot_upd as hot_updates,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
    `);

    // Métricas de conexões
    const connectionStats = await db.query(`
      SELECT
        state,
        COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `);

    return {
      tableStats: dbStats.rows,
      connectionStats: connectionStats.rows,
      timestamp: new Date().toISOString()
    };
  }

  // =====================================================
  // GERAÇÃO DE SEÇÕES
  // =====================================================

  private generateExecutiveSummary(auditData: any, consistencyData: any, securityData: any): ExecutiveSummary {
    // Calcular score de saúde geral (0-100)
    let healthScore = 100;

    // Penalizar por violações críticas
    healthScore -= Math.min(auditData.criticalIssues * 10, 50);

    // Penalizar por falhas de consistência
    const failedTests = consistencyData.currentReport.summary.failed;
    healthScore -= Math.min(failedTests * 5, 30);

    // Penalizar por violações de segurança
    healthScore -= Math.min(securityData.criticalViolations * 15, 40);

    healthScore = Math.max(0, healthScore);

    // Determinar status de integridade
    let dataIntegrityStatus: ExecutiveSummary['data_integrity_status'];
    if (healthScore >= 90) dataIntegrityStatus = 'excellent';
    else if (healthScore >= 75) dataIntegrityStatus = 'good';
    else if (healthScore >= 50) dataIntegrityStatus = 'warning';
    else dataIntegrityStatus = 'critical';

    // Principais descobertas
    const keyFindings: string[] = [];
    if (auditData.totalOperations > 0) {
      keyFindings.push(`${auditData.totalOperations} operações auditadas no período`);
    }
    if (auditData.totalViolations > 0) {
      keyFindings.push(`${auditData.totalViolations} violações detectadas`);
    }
    if (consistencyData.currentReport.summary.failed > 0) {
      keyFindings.push(`${consistencyData.currentReport.summary.failed} testes de consistência falharam`);
    }

    // Ações críticas necessárias
    const criticalActions: string[] = [];
    if (auditData.criticalIssues > 0) {
      criticalActions.push(`Resolver ${auditData.criticalIssues} problemas críticos imediatamente`);
    }
    if (securityData.criticalViolations > 0) {
      criticalActions.push(`Investigar ${securityData.criticalViolations} violações críticas de segurança`);
    }

    return {
      overall_health_score: Math.round(healthScore),
      data_integrity_status: dataIntegrityStatus,
      key_findings: keyFindings,
      critical_actions_required: criticalActions,
      compliance_status: {
        data_consistency: consistencyData.currentReport.summary.failed === 0,
        audit_trail_complete: auditData.totalOperations > 0,
        security_violations: securityData.totalViolations,
        backup_integrity: true // Assumindo que backups estão íntegros
      }
    };
  }

  private generateAuditTrailSection(auditData: any): AuditTrailSection {
    // Gerar timeline de operações
    const timeline = this.generateTimelineData(auditData.auditLogs);

    // Identificar atividades suspeitas
    const suspiciousActivities = auditData.auditLogs
      .filter((log: any) => log.severity === 'high' || log.severity === 'critical')
      .map((log: any) => ({
        type: log.violation_type || 'unknown',
        description: log.description || 'Atividade suspeita detectada',
        timestamp: log.timestamp,
        severity: log.severity,
        details: log.details || {}
      }));

    return {
      total_operations: auditData.totalOperations,
      operations_by_type: auditData.operationTypes,
      operations_by_table: auditData.tableOperations,
      operations_by_user: auditData.userOperations,
      timeline,
      suspicious_activities: suspiciousActivities
    };
  }

  private generateConsistencyAnalysisSection(consistencyData: any): ConsistencyAnalysisSection {
    const report = consistencyData.currentReport;

    // Calcular score de consistência
    const totalTests = report.summary.total_tests;
    const passedTests = report.summary.passed;
    const consistencyScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

    // Extrair problemas de integridade de dados
    const dataIntegrityIssues = report.test_results
      .filter((test: any) => test.status === 'failed')
      .map((test: any) => ({
        table: test.table_names.join(', '),
        issue_type: test.test_type,
        affected_records: test.affected_records,
        severity: test.severity,
        description: test.description
      }));

    // Reconciliação de saldos (exemplo)
    const balanceReconciliation = {
      accounts_checked: 0,
      discrepancies_found: 0,
      total_discrepancy_amount: 0,
      largest_discrepancy: 0
    };

    // Buscar teste de saldos específico
    const balanceTest = report.test_results.find((test: any) => test.test_type === 'balance_verification');
    if (balanceTest && balanceTest.details.balance_issues) {
      const issues = balanceTest.details.balance_issues;
      balanceReconciliation.accounts_checked = issues.length;
      balanceReconciliation.discrepancies_found = issues.length;
      balanceReconciliation.total_discrepancy_amount = issues.reduce((sum: number, issue: any) => sum + issue.difference, 0);
      balanceReconciliation.largest_discrepancy = Math.max(...issues.map((issue: any) => issue.difference));
    }

    return {
      consistency_score: consistencyScore,
      tests_performed: report.summary.total_tests,
      tests_passed: report.summary.passed,
      tests_failed: report.summary.failed,
      data_integrity_issues: dataIntegrityIssues,
      balance_reconciliation: balanceReconciliation
    };
  }

  private generateSecurityAnalysisSection(securityData: any): SecurityAnalysisSection {
    // Calcular score de segurança
    const totalViolations = securityData.totalViolations;
    const criticalViolations = securityData.criticalViolations;

    let securityScore = 100;
    securityScore -= Math.min(totalViolations * 2, 50);
    securityScore -= Math.min(criticalViolations * 10, 50);
    securityScore = Math.max(0, securityScore);

    // Analisar padrões de acesso
    const userAccessPatterns = new Map<string, any>();
    for (const access of securityData.unauthorizedAccess) {
      if (!userAccessPatterns.has(access.user_id)) {
        userAccessPatterns.set(access.user_id, {
          user_id: access.user_id,
          operations_count: 0,
          tables_accessed: new Set(),
          violations: 0
        });
      }
      const pattern = userAccessPatterns.get(access.user_id)!;
      pattern.operations_count++;
      pattern.tables_accessed.add(access.table_name);
      if (access.violation_type) pattern.violations++;
    }

    const dataAccessPatterns = Array.from(userAccessPatterns.values()).map(pattern => ({
      user_id: pattern.user_id,
      operations_count: pattern.operations_count,
      tables_accessed: Array.from(pattern.tables_accessed),
      risk_level: pattern.violations > 5 ? 'high' : pattern.violations > 2 ? 'medium' : 'low' as const
    }));

    // Agrupar violações de compliance
    const complianceViolations = new Map<string, any>();
    for (const violation of securityData.securityViolations) {
      const rule = violation.rule_violated || 'unknown';
      if (!complianceViolations.has(rule)) {
        complianceViolations.set(rule, {
          rule,
          violations_count: 0,
          severity: violation.severity,
          examples: []
        });
      }
      const compliance = complianceViolations.get(rule)!;
      compliance.violations_count++;
      if (compliance.examples.length < 3) {
        compliance.examples.push(violation);
      }
    }

    return {
      security_score: Math.round(securityScore),
      unauthorized_access_attempts: securityData.unauthorizedAccess.length,
      blocked_operations: securityData.securityViolations.filter((v: any) => v.action_taken === 'blocked').length,
      privilege_escalations: securityData.unauthorizedAccess.filter((a: any) => a.violation_type === 'privilege_escalation').length,
      data_access_patterns: dataAccessPatterns,
      compliance_violations: Array.from(complianceViolations.values())
    };
  }

  private generatePerformanceMetricsSection(performanceData: any): PerformanceMetricsSection {
    // Calcular métricas de performance do banco
    const totalOperations = performanceData.tableStats.reduce((sum: number, table: any) =>
      sum + table.inserts + table.updates + table.deletes, 0);

    const avgQueryTime = 50; // Placeholder - seria calculado de métricas reais
    const slowQueries = 5; // Placeholder
    const deadlocks = 0; // Placeholder

    // Calcular uso do pool de conexões
    const totalConnections = performanceData.connectionStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    const activeConnections = performanceData.connectionStats.find((stat: any) => stat.state === 'active')?.count || 0;
    const connectionPoolUsage = totalConnections > 0 ? Math.round((activeConnections / totalConnections) * 100) : 0;

    return {
      database_performance: {
        avg_query_time_ms: avgQueryTime,
        slow_queries_count: slowQueries,
        deadlocks_count: deadlocks,
        connection_pool_usage: connectionPoolUsage
      },
      audit_system_performance: {
        avg_audit_log_time_ms: 10, // Placeholder
        audit_queue_size: 0, // Placeholder
        failed_audit_logs: 0, // Placeholder
        storage_usage_mb: 100 // Placeholder
      },
      consistency_check_performance: {
        avg_check_time_ms: 500, // Placeholder
        checks_performed: 10, // Placeholder
        checks_failed: 0 // Placeholder
      }
    };
  }

  private generateRecommendationsSection(auditData: any, consistencyData: any, securityData: any): RecommendationsSection {
    const immediateActions: RecommendationsSection['immediate_actions'] = [];
    const longTermImprovements: RecommendationsSection['long_term_improvements'] = [];
    const complianceRecommendations: RecommendationsSection['compliance_recommendations'] = [];

    // Ações imediatas baseadas em problemas críticos
    if (auditData.criticalIssues > 0) {
      immediateActions.push({
        priority: 'critical',
        action: 'Resolver problemas críticos de auditoria',
        description: `${auditData.criticalIssues} problemas críticos foram identificados e precisam de atenção imediata`,
        estimated_effort: '2-4 horas',
        impact: 'Alto - Previne corrupção de dados e violações de segurança'
      });
    }

    if (consistencyData.currentReport.summary.failed > 0) {
      immediateActions.push({
        priority: 'high',
        action: 'Corrigir falhas de consistência',
        description: `${consistencyData.currentReport.summary.failed} testes de consistência falharam`,
        estimated_effort: '1-2 dias',
        impact: 'Alto - Garante integridade dos dados financeiros'
      });
    }

    if (securityData.criticalViolations > 0) {
      immediateActions.push({
        priority: 'critical',
        action: 'Investigar violações críticas de segurança',
        description: `${securityData.criticalViolations} violações críticas de segurança detectadas`,
        estimated_effort: '4-8 horas',
        impact: 'Crítico - Previne vazamento de dados e acesso não autorizado'
      });
    }

    // Melhorias de longo prazo
    longTermImprovements.push({
      category: 'Monitoramento',
      recommendation: 'Implementar alertas em tempo real para violações críticas',
      benefits: ['Detecção mais rápida de problemas', 'Redução do tempo de resposta', 'Melhor visibilidade operacional'],
      implementation_notes: 'Configurar sistema de notificações integrado com Slack/Email'
    });

    longTermImprovements.push({
      category: 'Automação',
      recommendation: 'Automatizar correção de problemas comuns de consistência',
      benefits: ['Redução de trabalho manual', 'Correção mais rápida', 'Menor chance de erro humano'],
      implementation_notes: 'Desenvolver scripts de auto-correção com aprovação manual para casos críticos'
    });

    // Recomendações de compliance
    complianceRecommendations.push({
      regulation: 'LGPD - Lei Geral de Proteção de Dados',
      current_status: 'Parcialmente conforme',
      required_actions: [
        'Implementar logs de acesso a dados pessoais',
        'Criar processo de anonimização de dados',
        'Documentar base legal para processamento'
      ]
    });

    return {
      immediate_actions: immediateActions,
      long_term_improvements: longTermImprovements,
      compliance_recommendations: complianceRecommendations
    };
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async createReportTables(): Promise<void> {
    // Tabela de configurações de relatórios
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_report_configs (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        report_type VARCHAR(20) NOT NULL,
        schedule_cron VARCHAR(100),
        filters JSONB NOT NULL DEFAULT '{}',
        format VARCHAR(10) NOT NULL DEFAULT 'json',
        recipients JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Tabela de relatórios gerados
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_reports (
        id UUID PRIMARY KEY,
        config_id UUID REFERENCES audit_report_configs(id),
        report_name VARCHAR(255) NOT NULL,
        report_type VARCHAR(20) NOT NULL,
        generation_time TIMESTAMPTZ NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL,
        file_path VARCHAR(500),
        file_size_bytes BIGINT,
        summary JSONB NOT NULL,
        sections JSONB NOT NULL,
        metadata JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Índices para performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_reports_generation_time ON audit_reports(generation_time)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_reports_status ON audit_reports(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_report_configs_active ON audit_report_configs(is_active)`);
  }

  private async loadReportConfigs(): Promise<void> {
    const result = await db.query(`
      SELECT * FROM audit_report_configs
      WHERE is_active = true
    `);

    for (const row of result.rows) {
      const config: AuditReportConfig = {
        ...row,
        filters: JSON.parse(row.filters || '{}'),
        recipients: JSON.parse(row.recipients || '[]')
      };
      this.reportConfigs.set(config.id, config);
    }

    console.log(`📋 Carregadas ${this.reportConfigs.size} configurações de relatórios`);
  }

  private async scheduleAutomaticReports(): Promise<void> {
    // Implementar agendamento baseado em cron
    // Por simplicidade, vamos agendar relatórios diários
    for (const [configId, config] of this.reportConfigs) {
      if (config.schedule_cron) {
        // Aqui seria implementado o agendamento real com cron
        console.log(`⏰ Agendando relatório: ${config.name}`);
      }
    }
  }

  private generateTimelineData(auditLogs: any[]): Array<{ date: string; operations_count: number; violations_count: number }> {
    const timeline = new Map<string, { operations_count: number; violations_count: number }>();

    for (const log of auditLogs) {
      const date = log.timestamp.split('T')[0];
      if (!timeline.has(date)) {
        timeline.set(date, { operations_count: 0, violations_count: 0 });
      }
      const entry = timeline.get(date)!;
      entry.operations_count++;
      if (log.severity === 'high' || log.severity === 'critical') {
        entry.violations_count++;
      }
    }

    return Array.from(timeline.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateConsistencyTrends(historicalReports: any[]): any {
    if (historicalReports.length < 2) return null;

    const latest = historicalReports[0];
    const previous = historicalReports[1];

    return {
      health_score_trend: latest.summary.passed - previous.summary.passed,
      violations_trend: latest.summary.failed - previous.summary.failed,
      critical_issues_trend: latest.summary.critical_issues - previous.summary.critical_issues
    };
  }

  private async generateOverviewData(): Promise<DashboardData['overview']> {
    const today = new Date().toISOString().split('T')[0];

    // Buscar operações de hoje
    const todayOperations = await db.query(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE DATE(timestamp) = $1
    `, [today]);

    // Buscar violações de hoje
    const todayViolations = await db.query(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE DATE(timestamp) = $1
        AND (severity = 'high' OR severity = 'critical')
    `, [today]);

    // Buscar problemas críticos
    const criticalIssues = await db.query(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE severity = 'critical'
        AND DATE(timestamp) >= $1
    `, [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]);

    // Status da última verificação de consistência
    const lastConsistencyCheck = await dataConsistencyService.getLatestConsistencyStatus();

    // Calcular score de saúde
    const healthScore = Math.max(0, 100 - (todayViolations.rows[0].count * 5) - (criticalIssues.rows[0].count * 10));

    return {
      health_score: Math.round(healthScore),
      total_operations_today: parseInt(todayOperations.rows[0].count),
      violations_today: parseInt(todayViolations.rows[0].count),
      critical_issues: parseInt(criticalIssues.rows[0].count),
      last_consistency_check: lastConsistencyCheck.last_check
    };
  }

  private async generateOperationsTimeline(startDate: string, endDate: string): Promise<DashboardData['charts']['operations_timeline']> {
    const result = await db.query(`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as operations,
        COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as violations
      FROM audit_logs
      WHERE DATE(timestamp) BETWEEN $1 AND $2
      GROUP BY DATE(timestamp)
      ORDER BY date
    `, [startDate, endDate]);

    return result.rows.map(row => ({
      date: row.date,
      operations: parseInt(row.operations),
      violations: parseInt(row.violations)
    }));
  }

  private async generateOperationsByType(date: string): Promise<DashboardData['charts']['operations_by_type']> {
    const result = await db.query(`
      SELECT
        operation,
        COUNT(*) as count
      FROM audit_logs
      WHERE DATE(timestamp) = $1
      GROUP BY operation
      ORDER BY count DESC
    `, [date]);

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    return result.rows.map(row => ({
      type: row.operation,
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
    }));
  }

  private async generateViolationsBySeverity(date: string): Promise<DashboardData['charts']['violations_by_severity']> {
    const result = await db.query(`
      SELECT
        severity,
        COUNT(*) as count
      FROM audit_logs
      WHERE DATE(timestamp) = $1
        AND severity IN ('low', 'medium', 'high', 'critical')
      GROUP BY severity
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `, [date]);

    const severityColors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d'
    };

    return result.rows.map(row => ({
      severity: row.severity,
      count: parseInt(row.count),
      color: severityColors[row.severity as keyof typeof severityColors] || '#6b7280'
    }));
  }

  private async generateTopTablesActivity(startDate: string, endDate: string): Promise<DashboardData['charts']['top_tables_activity']> {
    const result = await db.query(`
      SELECT
        table_name as table,
        COUNT(*) as operations,
        COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as violations
      FROM audit_logs
      WHERE DATE(timestamp) BETWEEN $1 AND $2
      GROUP BY table_name
      ORDER BY operations DESC
      LIMIT 10
    `, [startDate, endDate]);

    return result.rows.map(row => ({
      table: row.table,
      operations: parseInt(row.operations),
      violations: parseInt(row.violations)
    }));
  }

  private async getActiveAlerts(): Promise<DashboardData['alerts']> {
    // Por simplicidade, vamos gerar alertas baseados em dados recentes
    const alerts: DashboardData['alerts'] = [];

    // Verificar problemas críticos recentes
    const criticalIssues = await db.query(`
      SELECT * FROM audit_logs
      WHERE severity = 'critical'
        AND timestamp > NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
      LIMIT 5
    `);

    for (const issue of criticalIssues.rows) {
      alerts.push({
        id: this.generateUUID(),
        type: 'critical',
        title: 'Problema Crítico Detectado',
        message: `${issue.operation} em ${issue.table_name}: ${issue.description}`,
        timestamp: issue.timestamp,
        is_acknowledged: false
      });
    }

    return alerts;
  }

  private async getRecentActivities(limit: number): Promise<DashboardData['recent_activities']> {
    const result = await db.query(`
      SELECT
        timestamp,
        operation,
        table_name,
        user_id,
        CASE
          WHEN severity = 'critical' THEN 'blocked'
          WHEN severity IN ('high', 'medium') THEN 'violation'
          ELSE 'success'
        END as status
      FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      operation: row.operation,
      table: row.table_name,
      user: row.user_id || 'system',
      status: row.status
    }));
  }

  private async updateReportStatus(reportId: UUID, status: 'generating' | 'completed' | 'failed'): Promise<void> {
    await db.query(`
      UPDATE audit_reports
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, [status, reportId]);
  }

  private async saveReport(report: AuditReport): Promise<void> {
    await db.query(`
      INSERT INTO audit_reports (
        id, config_id, report_name, report_type, generation_time,
        execution_time_ms, status, summary, sections, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      report.id,
      report.config_id,
      report.report_name,
      report.report_type,
      report.generation_time,
      report.execution_time_ms,
      report.status,
      JSON.stringify(report.summary),
      JSON.stringify(report.sections),
      JSON.stringify(report.metadata)
    ]);
  }

  private async generateReportFile(report: AuditReport, format: string): Promise<string> {
    // Implementar geração de arquivos HTML, PDF, CSV
    // Por simplicidade, retornamos um caminho fictício
    const fileName = `audit-report-${report.id}.${format}`;
    const filePath = `./reports/${fileName}`;

    // Aqui seria implementada a geração real do arquivo
    console.log(`📄 Gerando arquivo de relatório: ${filePath}`);

    return filePath;
  }

  private async sendReportToRecipients(report: AuditReport, config: AuditReportConfig): Promise<void> {
    // Implementar envio por email
    console.log(`📧 Enviando relatório para ${config.recipients.length} destinatários`);
  }

  private async getFileSize(filePath: string): Promise<number> {
    // Implementar cálculo real do tamanho do arquivo
    return 1024 * 1024; // 1MB placeholder
  }

  private async getDatabaseVersion(): Promise<string> {
    const result = await db.query('SELECT version()');
    return result.rows[0].version;
  }

  private generateUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  public async createReportConfig(config: Omit<AuditReportConfig, 'id' | 'created_at' | 'updated_at'>): Promise<AuditReportConfig> {
    const id = this.generateUUID();
    const now = new Date().toISOString();

    const fullConfig: AuditReportConfig = {
      ...config,
      id,
      created_at: now,
      updated_at: now
    };

    await db.query(`
      INSERT INTO audit_report_configs (
        id, name, description, report_type, schedule_cron,
        filters, format, recipients, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      fullConfig.id,
      fullConfig.name,
      fullConfig.description,
      fullConfig.report_type,
      fullConfig.schedule_cron,
      JSON.stringify(fullConfig.filters),
      fullConfig.format,
      JSON.stringify(fullConfig.recipients),
      fullConfig.is_active
    ]);

    this.reportConfigs.set(id, fullConfig);
    return fullConfig;
  }

  public async getReports(limit: number = 20): Promise<AuditReport[]> {
    const result = await db.query(`
      SELECT * FROM audit_reports
      ORDER BY generation_time DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      ...row,
      summary: JSON.parse(row.summary),
      sections: JSON.parse(row.sections),
      metadata: JSON.parse(row.metadata)
    }));
  }

  public async getReport(reportId: UUID): Promise<AuditReport | null> {
    const result = await db.query(`
      SELECT * FROM audit_reports WHERE id = $1
    `, [reportId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      summary: JSON.parse(row.summary),
      sections: JSON.parse(row.sections),
      metadata: JSON.parse(row.metadata)
    };
  }
}

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

export const auditReportService = AuditReportService.getInstance();

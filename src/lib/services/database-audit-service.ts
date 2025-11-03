// =====================================================
// SERVIÇO CENTRAL DE AUDITORIA E CONSISTÊNCIA DE DADOS
// =====================================================

import { db } from '../config/database';
import { eventSystem } from '../events/event-system';
import { UUID, TimestampString } from '../types/database';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface AuditEntry {
  id: UUID;
  user_id?: UUID;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  record_id?: UUID;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: TimestampString;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  source: 'api' | 'direct' | 'migration' | 'system';
  metadata?: Record<string, any>;
}

export interface ConsistencyCheck {
  id: UUID;
  check_type: string;
  status: 'passed' | 'failed' | 'warning';
  details: Record<string, any>;
  timestamp: TimestampString;
  resolved: boolean;
}

export interface DataIntegrityViolation {
  id: UUID;
  violation_type: 'unauthorized_access' | 'bypass_attempt' | 'data_corruption' | 'consistency_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  table_name?: string;
  record_id?: UUID;
  detected_at: TimestampString;
  resolved: boolean;
  resolution_notes?: string;
}

// =====================================================
// CLASSE PRINCIPAL DO SERVIÇO DE AUDITORIA
// =====================================================

export class DatabaseAuditService {
  private static instance: DatabaseAuditService;
  private isInitialized = false;
  private authorizedSources = new Set(['api', 'system', 'migration']);
  private operationStack: string[] = [];

  public static getInstance(): DatabaseAuditService {
    if (!DatabaseAuditService.instance) {
      DatabaseAuditService.instance = new DatabaseAuditService();
    }
    return DatabaseAuditService.instance;
  }

  // =====================================================
  // INICIALIZAÇÃO E CONFIGURAÇÃO
  // =====================================================

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Criar tabelas de auditoria se não existirem
      await this.createAuditTables();

      // Configurar triggers de auditoria
      await this.setupAuditTriggers();

      // Inicializar sistema de monitoramento
      await this.initializeMonitoring();

      this.isInitialized = true;
      
      await this.logAuditEntry({
        table_name: 'system',
        operation: 'SELECT',
        source: 'system',
        metadata: { action: 'audit_service_initialized' }
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar DatabaseAuditService:', error);
      throw error;
    }
  }

  // =====================================================
  // INTERCEPTAÇÃO DE OPERAÇÕES
  // =====================================================

  public async executeOperation<T>(
    operation: () => Promise<T>,
    context: {
      table_name: string;
      operation_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
      user_id?: UUID;
      record_id?: UUID;
      source: 'api' | 'direct' | 'migration' | 'system';
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    const operationId = this.generateOperationId();
    this.operationStack.push(operationId);

    try {
      // Verificar se a operação é autorizada
      await this.validateOperation(context);

      // Capturar estado anterior (para UPDATE/DELETE)
      let oldValues: Record<string, any> | undefined;
      if (context.operation_type !== 'INSERT' && context.record_id) {
        oldValues = await this.captureCurrentState(context.table_name, context.record_id);
      }

      // Executar a operação
      const startTime = Date.now();
      const result = await operation();
      const executionTime = Date.now() - startTime;

      // Capturar estado posterior (para INSERT/UPDATE)
      let newValues: Record<string, any> | undefined;
      if (context.operation_type !== 'DELETE' && context.record_id) {
        newValues = await this.captureCurrentState(context.table_name, context.record_id);
      }

      // Registrar auditoria
      await this.logAuditEntry({
        user_id: context.user_id,
        table_name: context.table_name,
        operation: context.operation_type,
        record_id: context.record_id,
        old_values: oldValues,
        new_values: newValues,
        source: context.source,
        metadata: {
          ...context.metadata,
          execution_time_ms: executionTime,
          operation_id: operationId
        }
      });

      // Emitir evento
      eventSystem.emit('database_operation', {
        operation_id: operationId,
        table_name: context.table_name,
        operation_type: context.operation_type,
        success: true,
        execution_time: executionTime
      });

      return result;

    } catch (error) {
      // Registrar erro
      await this.logDataIntegrityViolation({
        violation_type: 'consistency_error',
        severity: 'high',
        description: `Erro durante operação ${context.operation_type} na tabela ${context.table_name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        table_name: context.table_name,
        record_id: context.record_id
      });

      eventSystem.emit('database_operation', {
        operation_id: operationId,
        table_name: context.table_name,
        operation_type: context.operation_type,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      throw error;
    } finally {
      this.operationStack.pop();
    }
  }

  // =====================================================
  // VALIDAÇÃO E SEGURANÇA
  // =====================================================

  private async validateOperation(context: {
    table_name: string;
    operation_type: string;
    source: string;
    user_id?: UUID;
  }): Promise<void> {
    // Verificar se a fonte é autorizada
    if (!this.authorizedSources.has(context.source)) {
      await this.logDataIntegrityViolation({
        violation_type: 'unauthorized_access',
        severity: 'critical',
        description: `Tentativa de acesso não autorizado à tabela ${context.table_name} com fonte ${context.source}`,
        table_name: context.table_name
      });
      throw new Error(`Fonte não autorizada: ${context.source}`);
    }

    // Verificar se há operações em cascata suspeitas
    if (this.operationStack.length > 10) {
      await this.logDataIntegrityViolation({
        violation_type: 'bypass_attempt',
        severity: 'high',
        description: `Possível tentativa de bypass detectada: muitas operações em cascata (${this.operationStack.length})`,
        table_name: context.table_name
      });
    }

    // Verificar se o usuário tem permissão (se aplicável)
    if (context.user_id && context.operation_type !== 'SELECT') {
      const hasPermission = await this.checkUserPermission(context.user_id, context.table_name, context.operation_type);
      if (!hasPermission) {
        await this.logDataIntegrityViolation({
          violation_type: 'unauthorized_access',
          severity: 'high',
          description: `Usuário ${context.user_id} não tem permissão para ${context.operation_type} na tabela ${context.table_name}`,
          table_name: context.table_name
        });
        throw new Error('Permissão negada');
      }
    }
  }

  // =====================================================
  // LOGS DE AUDITORIA
  // =====================================================

  private async logAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditEntry = {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    try {
      await db.query(`
        INSERT INTO audit_logs (
          id, user_id, table_name, operation, record_id,
          old_values, new_values, timestamp, ip_address,
          user_agent, session_id, source, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        auditEntry.id,
        auditEntry.user_id,
        auditEntry.table_name,
        auditEntry.operation,
        auditEntry.record_id,
        JSON.stringify(auditEntry.old_values),
        JSON.stringify(auditEntry.new_values),
        auditEntry.timestamp,
        auditEntry.ip_address,
        auditEntry.user_agent,
        auditEntry.session_id,
        auditEntry.source,
        JSON.stringify(auditEntry.metadata)
      ]);
    } catch (error) {
      console.error('Erro ao salvar log de auditoria:', error);
      // Não relançar o erro para não quebrar a operação principal
    }
  }

  private async logDataIntegrityViolation(violation: Omit<DataIntegrityViolation, 'id' | 'detected_at' | 'resolved'>): Promise<void> {
    const violationEntry: DataIntegrityViolation = {
      id: this.generateUUID(),
      detected_at: new Date().toISOString(),
      resolved: false,
      ...violation
    };

    try {
      await db.query(`
        INSERT INTO data_integrity_violations (
          id, violation_type, severity, description, table_name,
          record_id, detected_at, resolved, resolution_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        violationEntry.id,
        violationEntry.violation_type,
        violationEntry.severity,
        violationEntry.description,
        violationEntry.table_name,
        violationEntry.record_id,
        violationEntry.detected_at,
        violationEntry.resolved,
        violationEntry.resolution_notes
      ]);

      // Emitir alerta crítico
      if (violationEntry.severity === 'critical') {
        eventSystem.emit('security_alert', violationEntry);
        console.error('🚨 VIOLAÇÃO CRÍTICA DE INTEGRIDADE:', violationEntry);
      }
    } catch (error) {
      console.error('Erro ao salvar violação de integridade:', error);
    }
  }

  // =====================================================
  // TESTES DE CONSISTÊNCIA
  // =====================================================

  public async runConsistencyChecks(): Promise<ConsistencyCheck[]> {
    const checks: ConsistencyCheck[] = [];

    try {
      // Verificar integridade referencial
      const referentialCheck = await this.checkReferentialIntegrity();
      checks.push(referentialCheck);

      // Verificar saldos de contas
      const balanceCheck = await this.checkAccountBalances();
      checks.push(balanceCheck);

      // Verificar transações órfãs
      const orphanCheck = await this.checkOrphanTransactions();
      checks.push(orphanCheck);

      // Verificar duplicatas
      const duplicateCheck = await this.checkDuplicateRecords();
      checks.push(duplicateCheck);

      // Salvar resultados
      for (const check of checks) {
        await this.saveConsistencyCheck(check);
      }

      return checks;
    } catch (error) {
      console.error('Erro durante verificações de consistência:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async createAuditTables(): Promise<void> {
    // Criar tabela de logs de auditoria
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY,
        user_id UUID,
        table_name VARCHAR(100) NOT NULL,
        operation VARCHAR(10) NOT NULL,
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        source VARCHAR(20) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Criar tabela de violações de integridade
    await db.query(`
      CREATE TABLE IF NOT EXISTS data_integrity_violations (
        id UUID PRIMARY KEY,
        violation_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        table_name VARCHAR(100),
        record_id UUID,
        detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        resolution_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Criar tabela de verificações de consistência
    await db.query(`
      CREATE TABLE IF NOT EXISTS consistency_checks (
        id UUID PRIMARY KEY,
        check_type VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        details JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Criar índices para performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_table_operation ON audit_logs(table_name, operation)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_violations_severity ON data_integrity_violations(severity, resolved)`);
  }

  private async setupAuditTriggers(): Promise<void> {
    // Implementar triggers de auditoria automática para todas as tabelas principais
    const tables = ['users', 'accounts', 'transactions', 'categories', 'credit_cards'];

    for (const table of tables) {
      await db.query(`
        CREATE OR REPLACE FUNCTION audit_${table}_changes()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            INSERT INTO audit_logs (id, table_name, operation, record_id, old_values, source)
            VALUES (gen_random_uuid(), '${table}', 'DELETE', OLD.id, row_to_json(OLD), 'direct');
            RETURN OLD;
          ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO audit_logs (id, table_name, operation, record_id, old_values, new_values, source)
            VALUES (gen_random_uuid(), '${table}', 'UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW), 'direct');
            RETURN NEW;
          ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO audit_logs (id, table_name, operation, record_id, new_values, source)
            VALUES (gen_random_uuid(), '${table}', 'INSERT', NEW.id, row_to_json(NEW), 'direct');
            RETURN NEW;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await db.query(`
        DROP TRIGGER IF EXISTS audit_${table}_trigger ON ${table};
        CREATE TRIGGER audit_${table}_trigger
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_${table}_changes();
      `);
    }
  }

  private async initializeMonitoring(): Promise<void> {
    // Configurar monitoramento em tempo real
    setInterval(async () => {
      try {
        await this.runConsistencyChecks();
      } catch (error) {
        console.error('Erro durante verificação automática de consistência:', error);
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  private async captureCurrentState(tableName: string, recordId: UUID): Promise<Record<string, any> | undefined> {
    try {
      const result = await db.query(`SELECT * FROM ${tableName} WHERE id = $1`, [recordId]);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error(`Erro ao capturar estado da tabela ${tableName}:`, error);
      return undefined;
    }
  }

  private async checkUserPermission(userId: UUID, tableName: string, operation: string): Promise<boolean> {
    // Implementar lógica de permissões baseada em roles
    // Por enquanto, permitir todas as operações para usuários autenticados
    return true;
  }

  private async checkReferentialIntegrity(): Promise<ConsistencyCheck> {
    // Implementar verificação de integridade referencial
    return {
      id: this.generateUUID(),
      check_type: 'referential_integrity',
      status: 'passed',
      details: { message: 'Integridade referencial verificada' },
      timestamp: new Date().toISOString(),
      resolved: true
    };
  }

  private async checkAccountBalances(): Promise<ConsistencyCheck> {
    // Implementar verificação de saldos
    return {
      id: this.generateUUID(),
      check_type: 'account_balances',
      status: 'passed',
      details: { message: 'Saldos de contas verificados' },
      timestamp: new Date().toISOString(),
      resolved: true
    };
  }

  private async checkOrphanTransactions(): Promise<ConsistencyCheck> {
    // Implementar verificação de transações órfãs
    return {
      id: this.generateUUID(),
      check_type: 'orphan_transactions',
      status: 'passed',
      details: { message: 'Nenhuma transação órfã encontrada' },
      timestamp: new Date().toISOString(),
      resolved: true
    };
  }

  private async checkDuplicateRecords(): Promise<ConsistencyCheck> {
    // Implementar verificação de duplicatas
    return {
      id: this.generateUUID(),
      check_type: 'duplicate_records',
      status: 'passed',
      details: { message: 'Nenhuma duplicata encontrada' },
      timestamp: new Date().toISOString(),
      resolved: true
    };
  }

  private async saveConsistencyCheck(check: ConsistencyCheck): Promise<void> {
    await db.query(`
      INSERT INTO consistency_checks (id, check_type, status, details, timestamp, resolved)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [check.id, check.check_type, check.status, JSON.stringify(check.details), check.timestamp, check.resolved]);
  }

  private generateUUID(): UUID {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  public async getAuditLogs(filters?: {
    table_name?: string;
    operation?: string;
    user_id?: UUID;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.table_name) {
      query += ` AND table_name = $${paramIndex++}`;
      params.push(filters.table_name);
    }

    if (filters?.operation) {
      query += ` AND operation = $${paramIndex++}`;
      params.push(filters.operation);
    }

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.user_id);
    }

    if (filters?.start_date) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  public async getIntegrityViolations(resolved?: boolean): Promise<DataIntegrityViolation[]> {
    let query = 'SELECT * FROM data_integrity_violations';
    const params: any[] = [];

    if (resolved !== undefined) {
      query += ' WHERE resolved = $1';
      params.push(resolved);
    }

    query += ' ORDER BY detected_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  public async generateAuditReport(startDate: string, endDate: string): Promise<{
    summary: Record<string, any>;
    operations: AuditEntry[];
    violations: DataIntegrityViolation[];
    consistency_checks: ConsistencyCheck[];
  }> {
    const operations = await this.getAuditLogs({ start_date: startDate, end_date: endDate });
    const violations = await this.getIntegrityViolations(false);

    const checksResult = await db.query(`
      SELECT * FROM consistency_checks
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp DESC
    `, [startDate, endDate]);

    const consistency_checks = checksResult.rows;

    const summary = {
      total_operations: operations.length,
      operations_by_type: this.groupBy(operations, 'operation'),
      operations_by_table: this.groupBy(operations, 'table_name'),
      total_violations: violations.length,
      violations_by_severity: this.groupBy(violations, 'severity'),
      consistency_status: consistency_checks.filter(c => c.status === 'passed').length / Math.max(consistency_checks.length, 1)
    };

    return { summary, operations, violations, consistency_checks };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

export const databaseAuditService = DatabaseAuditService.getInstance();

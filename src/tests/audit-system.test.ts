/**
 * Testes Unitários para o Sistema de Auditoria e Consistência de Dados
 * Garante que o banco PostgreSQL/Neon seja a única fonte de verdade
 */

import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { Pool, Client } from 'pg';
import { DatabaseAuditService } from '../services/database-audit-service';
import { DataConsistencyService } from '../services/data-consistency-service';
import { AuditReportService } from '../services/audit-report-service';
import {
  AuditEntry,
  AuditOperationType,
  AuditSeverity,
  ConsistencyTestResult,
  DataIntegrityViolation,
  SecurityEvent,
  AuditContext,
  TestStatus,
  ConsistencyStatus
} from '../types/audit-system';

// ============================================================================
// CONFIGURAÇÃO DOS TESTES
// ============================================================================

const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'suagrana_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

let testPool: Pool;
let auditService: DatabaseAuditService;
let consistencyService: DataConsistencyService;
let reportService: AuditReportService;

// ============================================================================
// SETUP E TEARDOWN
// ============================================================================

beforeAll(async () => {
  testPool = new Pool(TEST_DB_CONFIG);
  
  // Criar tabelas de teste
  await setupTestTables();
  
  // Inicializar serviços
  auditService = new DatabaseAuditService(testPool);
  consistencyService = new DataConsistencyService(testPool);
  reportService = new AuditReportService(testPool);
  
  await auditService.initialize();
  await consistencyService.initialize();
  await reportService.initialize();
});

afterAll(async () => {
  await cleanupTestTables();
  await testPool.end();
});

beforeEach(async () => {
  // Limpar dados de teste antes de cada teste
  await testPool.query('TRUNCATE TABLE audit_logs, consistency_checks, security_events, audit_reports CASCADE');
  await testPool.query('TRUNCATE TABLE test_accounts, test_transactions CASCADE');
});

afterEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function setupTestTables(): Promise<void> {
  const client = await testPool.connect();
  
  try {
    // Tabelas de teste para simular dados financeiros
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        balance DECIMAL(15,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES test_accounts(id),
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Inserir dados de teste
    await client.query(`
      INSERT INTO test_accounts (name, balance) VALUES 
      ('Conta Corrente', 1000.00),
      ('Conta Poupança', 5000.00),
      ('Cartão de Crédito', -500.00)
    `);
    
  } finally {
    client.release();
  }
}

async function cleanupTestTables(): Promise<void> {
  const client = await testPool.connect();
  
  try {
    await client.query('DROP TABLE IF EXISTS test_transactions CASCADE');
    await client.query('DROP TABLE IF EXISTS test_accounts CASCADE');
  } finally {
    client.release();
  }
}

function createMockAuditContext(overrides: Partial<AuditContext> = {}): AuditContext {
  return {
    userId: 'test-user-123',
    sessionId: 'test-session-456',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    operation: 'CREATE',
    tableName: 'test_accounts',
    recordId: 'test-record-789',
    metadata: { test: true },
    ...overrides
  };
}

// ============================================================================
// TESTES DO SERVIÇO DE AUDITORIA
// ============================================================================

describe('DatabaseAuditService', () => {
  describe('Inicialização', () => {
    it('deve criar tabelas de auditoria corretamente', async () => {
      const result = await testPool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('audit_logs', 'security_events', 'data_integrity_violations')
      `);
      
      expect(result.rows).toHaveLength(3);
      expect(result.rows.map(r => r.table_name)).toContain('audit_logs');
      expect(result.rows.map(r => r.table_name)).toContain('security_events');
      expect(result.rows.map(r => r.table_name)).toContain('data_integrity_violations');
    });
    
    it('deve configurar triggers de auditoria', async () => {
      const result = await testPool.query(`
        SELECT trigger_name FROM information_schema.triggers 
        WHERE event_object_table IN ('test_accounts', 'test_transactions')
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
  
  describe('Logging de Operações', () => {
    it('deve registrar operação CREATE corretamente', async () => {
      const context = createMockAuditContext({ operation: 'CREATE' });
      const newValues = { name: 'Nova Conta', balance: 1000 };
      
      await auditService.logOperation(context, undefined, newValues);
      
      const result = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      const log = result.rows[0];
      
      expect(log.operation).toBe('CREATE');
      expect(log.table_name).toBe('test_accounts');
      expect(log.user_id).toBe('test-user-123');
      expect(log.new_values).toEqual(newValues);
      expect(log.old_values).toBeNull();
    });
    
    it('deve registrar operação UPDATE com valores antigos e novos', async () => {
      const context = createMockAuditContext({ operation: 'UPDATE' });
      const oldValues = { name: 'Conta Antiga', balance: 500 };
      const newValues = { name: 'Conta Nova', balance: 1000 };
      
      await auditService.logOperation(context, oldValues, newValues);
      
      const result = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      const log = result.rows[0];
      
      expect(log.operation).toBe('UPDATE');
      expect(log.old_values).toEqual(oldValues);
      expect(log.new_values).toEqual(newValues);
    });
    
    it('deve registrar operação DELETE corretamente', async () => {
      const context = createMockAuditContext({ operation: 'DELETE' });
      const oldValues = { name: 'Conta Deletada', balance: 0 };
      
      await auditService.logOperation(context, oldValues);
      
      const result = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      const log = result.rows[0];
      
      expect(log.operation).toBe('DELETE');
      expect(log.old_values).toEqual(oldValues);
      expect(log.new_values).toBeNull();
    });
    
    it('deve calcular tempo de execução corretamente', async () => {
      const context = createMockAuditContext();
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Simular operação
      await auditService.logOperation(context);
      
      const result = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      const log = result.rows[0];
      
      expect(log.execution_time_ms).toBeGreaterThan(0);
      expect(log.execution_time_ms).toBeLessThan(1000);
    });
  });
  
  describe('Eventos de Segurança', () => {
    it('deve registrar tentativa de acesso não autorizado', async () => {
      const securityEvent = {
        event_type: 'UNAUTHORIZED_ACCESS' as const,
        threat_level: 'HIGH' as SecurityThreatLevel,
        source_ip: '192.168.1.100',
        user_agent: 'Malicious Bot',
        blocked: true,
        details: {
          attempted_operation: 'SELECT * FROM accounts',
          target_table: 'accounts',
          reason: 'IP não está na whitelist'
        }
      };
      
      await auditService.logSecurityEvent(securityEvent);
      
      const result = await testPool.query('SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 1');
      const event = result.rows[0];
      
      expect(event.event_type).toBe('UNAUTHORIZED_ACCESS');
      expect(event.threat_level).toBe('HIGH');
      expect(event.source_ip).toBe('192.168.1.100');
      expect(event.blocked).toBe(true);
    });
    
    it('deve registrar tentativa de bypass do sistema', async () => {
      const securityEvent = {
        event_type: 'BYPASS_ATTEMPT' as const,
        threat_level: 'CRITICAL' as SecurityThreatLevel,
        source_ip: '10.0.0.1',
        details: {
          attempted_operation: 'Direct database connection',
          reason: 'Tentativa de conexão direta ao banco'
        }
      };
      
      await auditService.logSecurityEvent(securityEvent);
      
      const result = await testPool.query('SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 1');
      const event = result.rows[0];
      
      expect(event.event_type).toBe('BYPASS_ATTEMPT');
      expect(event.threat_level).toBe('CRITICAL');
    });
  });
  
  describe('Interceptação de Operações', () => {
    it('deve interceptar e auditar operações de banco', async () => {
      const context = createMockAuditContext();
      
      // Simular operação interceptada
      const result = await auditService.executeAndAudit(
        context,
        async () => {
          return await testPool.query('SELECT COUNT(*) FROM test_accounts');
        }
      );
      
      expect(result.rows).toBeDefined();
      
      // Verificar se foi auditado
      const auditResult = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].success).toBe(true);
    });
    
    it('deve auditar operações que falharam', async () => {
      const context = createMockAuditContext();
      
      try {
        await auditService.executeAndAudit(
          context,
          async () => {
            throw new Error('Operação falhou');
          }
        );
      } catch (error) {
        // Esperado que falhe
      }
      
      const auditResult = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].success).toBe(false);
      expect(auditResult.rows[0].error_message).toBe('Operação falhou');
    });
  });
});

// ============================================================================
// TESTES DO SERVIÇO DE CONSISTÊNCIA
// ============================================================================

describe('DataConsistencyService', () => {
  describe('Testes de Integridade Referencial', () => {
    it('deve detectar registros órfãos', async () => {
      // Inserir transação com account_id inválido
      await testPool.query(`
        INSERT INTO test_transactions (account_id, amount, description) 
        VALUES ('00000000-0000-0000-0000-000000000000', 100, 'Transação órfã')
      `);
      
      const result = await consistencyService.runSpecificCheck('referential_integrity');
      
      expect(result.status).toBe('FAILED');
      expect(result.violationsFound).toBeGreaterThan(0);
      expect(result.details.violations).toHaveLength(1);
      expect(result.details.violations[0].violation_type).toBe('ORPHAN_RECORD');
    });
    
    it('deve validar integridade referencial correta', async () => {
      // Todos os dados de teste devem estar corretos
      const result = await consistencyService.runSpecificCheck('referential_integrity');
      
      expect(result.status).toBe('PASSED');
      expect(result.violationsFound).toBe(0);
    });
  });
  
  describe('Validação de Saldos', () => {
    it('deve detectar saldos inconsistentes', async () => {
      // Inserir transações que não batem com o saldo da conta
      const accountResult = await testPool.query('SELECT id FROM test_accounts LIMIT 1');
      const accountId = accountResult.rows[0].id;
      
      await testPool.query(`
        INSERT INTO test_transactions (account_id, amount, description) 
        VALUES ($1, -2000, 'Transação que deixa saldo negativo incorreto')
      `, [accountId]);
      
      const result = await consistencyService.runSpecificCheck('balance_validation');
      
      expect(result.status).toBe('FAILED');
      expect(result.violationsFound).toBeGreaterThan(0);
    });
  });
  
  describe('Detecção de Duplicatas', () => {
    it('deve detectar transações duplicadas', async () => {
      const accountResult = await testPool.query('SELECT id FROM test_accounts LIMIT 1');
      const accountId = accountResult.rows[0].id;
      
      // Inserir transações idênticas
      const transactionData = {
        account_id: accountId,
        amount: 100,
        description: 'Transação duplicada'
      };
      
      await testPool.query(`
        INSERT INTO test_transactions (account_id, amount, description) 
        VALUES ($1, $2, $3), ($1, $2, $3)
      `, [transactionData.account_id, transactionData.amount, transactionData.description]);
      
      const result = await consistencyService.runSpecificCheck('duplicates');
      
      expect(result.status).toBe('FAILED');
      expect(result.violationsFound).toBeGreaterThan(0);
    });
  });
  
  describe('Snapshots de Dados', () => {
    it('deve criar snapshot completo dos dados', async () => {
      const snapshot = await consistencyService.createSnapshot('FULL');
      
      expect(snapshot.id).toBeDefined();
      expect(snapshot.snapshot_type).toBe('FULL');
      expect(snapshot.tables_included).toContain('test_accounts');
      expect(snapshot.tables_included).toContain('test_transactions');
      expect(snapshot.total_records).toBeGreaterThan(0);
      expect(snapshot.checksum).toBeDefined();
    });
    
    it('deve comparar snapshots e detectar diferenças', async () => {
      const snapshot1 = await consistencyService.createSnapshot('FULL');
      
      // Modificar dados
      await testPool.query('UPDATE test_accounts SET balance = balance + 100 WHERE name = $1', ['Conta Corrente']);
      
      const snapshot2 = await consistencyService.createSnapshot('FULL');
      
      const comparison = await consistencyService.compareSnapshots(snapshot1.id, snapshot2.id);
      
      expect(comparison.status).toBe('FAILED');
      expect(comparison.violationsFound).toBeGreaterThan(0);
      expect(comparison.details.description).toContain('diferenças detectadas');
    });
  });
  
  describe('Relatório de Consistência', () => {
    it('deve gerar relatório completo de consistência', async () => {
      const report = await consistencyService.runConsistencyChecks();
      
      expect(report.id).toBeDefined();
      expect(report.overall_status).toBeOneOf(['CONSISTENT', 'INCONSISTENT', 'WARNING']);
      expect(report.tests_executed).toBeGreaterThan(0);
      expect(report.test_results).toBeInstanceOf(Array);
      expect(report.summary.health_score).toBeGreaterThanOrEqual(0);
      expect(report.summary.health_score).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// TESTES DO SERVIÇO DE RELATÓRIOS
// ============================================================================

describe('AuditReportService', () => {
  beforeEach(async () => {
    // Inserir dados de teste para relatórios
    const context = createMockAuditContext();
    await auditService.logOperation(context, undefined, { test: 'data' });
    
    const securityEvent = {
      event_type: 'UNAUTHORIZED_ACCESS' as const,
      threat_level: 'MEDIUM' as SecurityThreatLevel,
      source_ip: '192.168.1.1',
      blocked: true,
      details: {
        attempted_operation: 'SELECT',
        reason: 'Test security event'
      }
    };
    await auditService.logSecurityEvent(securityEvent);
  });
  
  describe('Geração de Relatórios', () => {
    it('deve gerar relatório de auditoria completo', async () => {
      const config = {
        id: 'test-config-1',
        name: 'Relatório de Teste',
        description: 'Relatório para testes unitários',
        report_type: 'AUDIT_TRAIL' as const,
        format: 'JSON' as const,
        filters: {
          date_range: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h atrás
            end: new Date()
          }
        },
        recipients: ['test@example.com'],
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const report = await reportService.generateReport(config.id);
      
      expect(report.id).toBeDefined();
      expect(report.config_id).toBe(config.id);
      expect(report.executive_summary).toBeDefined();
      expect(report.audit_trail).toBeDefined();
      expect(report.security_analysis).toBeDefined();
      expect(report.executive_summary.total_operations).toBeGreaterThan(0);
    });
    
    it('deve gerar dados para dashboard', async () => {
      const dashboardData = await reportService.getDashboardData();
      
      expect(dashboardData.timestamp).toBeDefined();
      expect(dashboardData.system_health).toBeDefined();
      expect(dashboardData.real_time_metrics).toBeDefined();
      expect(dashboardData.recent_activities).toBeDefined();
      expect(dashboardData.alerts).toBeInstanceOf(Array);
      expect(dashboardData.charts_data).toBeDefined();
      
      expect(dashboardData.system_health.overall_score).toBeGreaterThanOrEqual(0);
      expect(dashboardData.system_health.overall_score).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Análise de Tendências', () => {
    it('deve calcular tendências de operações', async () => {
      const dashboardData = await reportService.getDashboardData();
      
      expect(dashboardData.charts_data.operations_timeline).toBeInstanceOf(Array);
      expect(dashboardData.charts_data.consistency_trends).toBeInstanceOf(Array);
      expect(dashboardData.charts_data.security_events_timeline).toBeInstanceOf(Array);
    });
  });
});

// ============================================================================
// TESTES DE INTEGRAÇÃO
// ============================================================================

describe('Integração do Sistema de Auditoria', () => {
  it('deve funcionar end-to-end: operação -> auditoria -> consistência -> relatório', async () => {
    // 1. Executar operação auditada
    const context = createMockAuditContext({ operation: 'CREATE' });
    const newAccount = { name: 'Conta de Integração', balance: 2000 };
    
    const accountResult = await auditService.executeAndAudit(
      context,
      async () => {
        return await testPool.query(
          'INSERT INTO test_accounts (name, balance) VALUES ($1, $2) RETURNING *',
          [newAccount.name, newAccount.balance]
        );
      }
    );
    
    expect(accountResult.rows).toHaveLength(1);
    
    // 2. Verificar se foi auditado
    const auditResult = await testPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
    expect(auditResult.rows).toHaveLength(1);
    expect(auditResult.rows[0].operation).toBe('CREATE');
    
    // 3. Executar teste de consistência
    const consistencyReport = await consistencyService.runConsistencyChecks();
    expect(consistencyReport.overall_status).toBeOneOf(['CONSISTENT', 'WARNING']);
    
    // 4. Gerar relatório
    const dashboardData = await reportService.getDashboardData();
    expect(dashboardData.recent_activities.total_operations_last_hour).toBeGreaterThan(0);
  });
  
  it('deve detectar e bloquear operações suspeitas', async () => {
    // Simular operação suspeita
    const suspiciousContext = createMockAuditContext({
      ipAddress: '192.168.1.999', // IP suspeito
      operation: 'DELETE',
      tableName: 'test_accounts'
    });
    
    // Tentar executar operação suspeita
    let operationBlocked = false;
    try {
      await auditService.validateSecurityRules(suspiciousContext);
    } catch (error) {
      operationBlocked = true;
    }
    
    // Verificar se evento de segurança foi registrado
    const securityEvents = await testPool.query('SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 1');
    expect(securityEvents.rows.length).toBeGreaterThan(0);
    
    // Verificar se aparece no dashboard
    const dashboardData = await reportService.getDashboardData();
    expect(dashboardData.recent_activities.security_events_last_hour).toBeGreaterThan(0);
  });
});

// ============================================================================
// TESTES DE PERFORMANCE
// ============================================================================

describe('Performance do Sistema de Auditoria', () => {
  it('deve processar múltiplas operações em paralelo', async () => {
    const startTime = Date.now();
    const operations = [];
    
    // Criar 10 operações simultâneas
    for (let i = 0; i < 10; i++) {
      const context = createMockAuditContext({
        recordId: `test-record-${i}`,
        metadata: { iteration: i }
      });
      
      operations.push(auditService.logOperation(context, undefined, { test: `data-${i}` }));
    }
    
    await Promise.all(operations);
    const endTime = Date.now();
    
    // Verificar se todas foram processadas
    const result = await testPool.query('SELECT COUNT(*) FROM audit_logs');
    expect(parseInt(result.rows[0].count)).toBe(10);
    
    // Verificar performance (deve processar em menos de 1 segundo)
    expect(endTime - startTime).toBeLessThan(1000);
  });
  
  it('deve manter performance com grande volume de dados', async () => {
    // Inserir muitos registros de auditoria
    const batchSize = 100;
    const context = createMockAuditContext();
    
    const startTime = Date.now();
    
    for (let i = 0; i < batchSize; i++) {
      await auditService.logOperation(
        { ...context, recordId: `batch-record-${i}` },
        undefined,
        { batch: i }
      );
    }
    
    const endTime = Date.now();
    const avgTimePerOperation = (endTime - startTime) / batchSize;
    
    // Cada operação deve levar menos de 50ms em média
    expect(avgTimePerOperation).toBeLessThan(50);
    
    // Verificar se consultas ainda são rápidas
    const queryStart = Date.now();
    await testPool.query('SELECT COUNT(*) FROM audit_logs');
    const queryEnd = Date.now();
    
    expect(queryEnd - queryStart).toBeLessThan(100);
  });
});

// ============================================================================
// TESTES DE RECUPERAÇÃO E LIMPEZA
// ============================================================================

describe('Recuperação e Manutenção', () => {
  it('deve fazer limpeza de logs antigos', async () => {
    // Inserir logs antigos (simulando com timestamp modificado)
    await testPool.query(`
      INSERT INTO audit_logs (operation, table_name, timestamp, success, execution_time_ms)
      VALUES ('CREATE', 'test_table', NOW() - INTERVAL '40 days', true, 100)
    `);
    
    const cleanupResult = await auditService.cleanup(30); // Limpar logs > 30 dias
    
    expect(cleanupResult).toBeGreaterThan(0);
    
    // Verificar se log antigo foi removido
    const remainingLogs = await testPool.query(`
      SELECT COUNT(*) FROM audit_logs 
      WHERE timestamp < NOW() - INTERVAL '30 days'
    `);
    
    expect(parseInt(remainingLogs.rows[0].count)).toBe(0);
  });
  
  it('deve recuperar de falhas de conexão', async () => {
    // Simular falha de conexão (fechando pool temporariamente)
    const originalQuery = testPool.query;
    let failureCount = 0;
    
    testPool.query = jest.fn().mockImplementation((...args) => {
      failureCount++;
      if (failureCount <= 2) {
        throw new Error('Connection failed');
      }
      return originalQuery.apply(testPool, args);
    });
    
    const context = createMockAuditContext();
    
    // Deve tentar novamente e eventualmente ter sucesso
    await expect(auditService.logOperation(context)).resolves.not.toThrow();
    
    // Restaurar função original
    testPool.query = originalQuery;
  });
});

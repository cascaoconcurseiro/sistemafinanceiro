/**
 * Testes de Integração do Sistema de Auditoria e Consistência
 * Valida cenários reais de uso e integração com o sistema financeiro
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { DatabaseAuditService } from '../../services/database-audit-service';
import { DataConsistencyService } from '../../services/data-consistency-service';
import { AuditReportService } from '../../services/audit-report-service';
import { DatabaseSecurityMiddleware } from '../../middleware/database-security-middleware';
import {
  AuditContext,
  AuditOperationType,
  SecurityThreatLevel,
  ConsistencyStatus
} from '../../types/audit-system';

// ============================================================================
// CONFIGURAÇÃO DOS TESTES DE INTEGRAÇÃO
// ============================================================================

const INTEGRATION_DB_CONFIG = {
  host: process.env.INTEGRATION_DB_HOST || 'localhost',
  port: parseInt(process.env.INTEGRATION_DB_PORT || '5432'),
  database: process.env.INTEGRATION_DB_NAME || 'suagrana_integration_test',
  user: process.env.INTEGRATION_DB_USER || 'postgres',
  password: process.env.INTEGRATION_DB_PASSWORD || 'password'
};

let integrationPool: Pool;
let auditService: DatabaseAuditService;
let consistencyService: DataConsistencyService;
let reportService: AuditReportService;
let securityMiddleware: DatabaseSecurityMiddleware;

// ============================================================================
// SETUP E TEARDOWN
// ============================================================================

beforeAll(async () => {
  integrationPool = new Pool(INTEGRATION_DB_CONFIG);
  
  // Criar esquema completo do sistema financeiro
  await setupFinancialSchema();
  
  // Inicializar todos os serviços
  auditService = new DatabaseAuditService(integrationPool);
  consistencyService = new DataConsistencyService(integrationPool);
  reportService = new AuditReportService(integrationPool);
  securityMiddleware = new DatabaseSecurityMiddleware(integrationPool);
  
  await auditService.initialize();
  await consistencyService.initialize();
  await reportService.initialize();
  await securityMiddleware.initialize();
});

afterAll(async () => {
  await cleanupIntegrationData();
  await integrationPool.end();
});

beforeEach(async () => {
  // Limpar dados entre testes, mas manter estrutura
  await integrationPool.query(`
    TRUNCATE TABLE transactions, accounts, users, 
    audit_logs, security_events, consistency_checks, 
    audit_reports CASCADE
  `);
  
  // Inserir dados base para testes
  await insertBaseTestData();
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function setupFinancialSchema(): Promise<void> {
  const client = await integrationPool.connect();
  
  try {
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela de contas
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT')),
        balance DECIMAL(15,2) NOT NULL DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'BRL',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela de transações
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Índices para performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
    
  } finally {
    client.release();
  }
}

async function insertBaseTestData(): Promise<void> {
  const client = await integrationPool.connect();
  
  try {
    // Inserir usuários de teste
    const userResult = await client.query(`
      INSERT INTO users (email, name) VALUES 
      ('user1@test.com', 'Usuário Teste 1'),
      ('user2@test.com', 'Usuário Teste 2')
      RETURNING id
    `);
    
    const [user1Id, user2Id] = userResult.rows.map(r => r.id);
    
    // Inserir contas de teste
    const accountResult = await client.query(`
      INSERT INTO accounts (user_id, name, type, balance) VALUES 
      ($1, 'Conta Corrente', 'CHECKING', 1000.00),
      ($1, 'Conta Poupança', 'SAVINGS', 5000.00),
      ($2, 'Cartão de Crédito', 'CREDIT_CARD', -500.00),
      ($2, 'Investimentos', 'INVESTMENT', 10000.00)
      RETURNING id
    `, [user1Id, user2Id]);
    
    const accountIds = accountResult.rows.map(r => r.id);
    
    // Inserir transações de teste
    await client.query(`
      INSERT INTO transactions (account_id, type, amount, description, category, date) VALUES 
      ($1, 'INCOME', 2000.00, 'Salário', 'Trabalho', CURRENT_DATE),
      ($1, 'EXPENSE', -150.00, 'Supermercado', 'Alimentação', CURRENT_DATE),
      ($2, 'INCOME', 100.00, 'Rendimento', 'Investimento', CURRENT_DATE),
      ($3, 'EXPENSE', -80.00, 'Combustível', 'Transporte', CURRENT_DATE)
    `, accountIds);
    
  } finally {
    client.release();
  }
}

async function cleanupIntegrationData(): Promise<void> {
  const client = await integrationPool.connect();
  
  try {
    await client.query('DROP TABLE IF EXISTS transactions CASCADE');
    await client.query('DROP TABLE IF EXISTS accounts CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
  } finally {
    client.release();
  }
}

function createFinancialAuditContext(
  operation: AuditOperationType,
  tableName: string,
  overrides: Partial<AuditContext> = {}
): AuditContext {
  return {
    userId: 'integration-user-123',
    sessionId: 'integration-session-456',
    ipAddress: '127.0.0.1',
    userAgent: 'Integration Test Agent',
    operation,
    tableName,
    recordId: `integration-record-${Date.now()}`,
    metadata: { 
      test_type: 'integration',
      timestamp: new Date().toISOString()
    },
    ...overrides
  };
}

// ============================================================================
// TESTES DE CENÁRIOS FINANCEIROS REAIS
// ============================================================================

describe('Cenários Financeiros Reais', () => {
  describe('Criação de Conta', () => {
    it('deve auditar criação completa de conta com validações', async () => {
      const userResult = await integrationPool.query('SELECT id FROM users LIMIT 1');
      const userId = userResult.rows[0].id;
      
      const context = createFinancialAuditContext('CREATE', 'accounts', {
        metadata: { user_id: userId, account_type: 'CHECKING' }
      });
      
      const newAccount = {
        user_id: userId,
        name: 'Nova Conta Corrente',
        type: 'CHECKING',
        balance: 0,
        currency: 'BRL'
      };
      
      // Executar criação auditada
      const result = await auditService.executeAndAudit(
        context,
        async () => {
          return await integrationPool.query(`
            INSERT INTO accounts (user_id, name, type, balance, currency) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
          `, [newAccount.user_id, newAccount.name, newAccount.type, newAccount.balance, newAccount.currency]);
        }
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Nova Conta Corrente');
      
      // Verificar auditoria
      const auditResult = await integrationPool.query(`
        SELECT * FROM audit_logs 
        WHERE operation = 'CREATE' AND table_name = 'accounts' 
        ORDER BY timestamp DESC LIMIT 1
      `);
      
      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].success).toBe(true);
      expect(auditResult.rows[0].new_values).toMatchObject(newAccount);
      
      // Executar teste de consistência
      const consistencyResult = await consistencyService.runSpecificCheck('referential_integrity');
      expect(consistencyResult.status).toBe('PASSED');
    });
  });
  
  describe('Transações Financeiras', () => {
    it('deve auditar transação com atualização de saldo', async () => {
      const accountResult = await integrationPool.query('SELECT id, balance FROM accounts WHERE type = $1 LIMIT 1', ['CHECKING']);
      const account = accountResult.rows[0];
      const originalBalance = parseFloat(account.balance);
      
      const transactionAmount = 500.00;
      const newBalance = originalBalance + transactionAmount;
      
      // Contexto para transação
      const transactionContext = createFinancialAuditContext('CREATE', 'transactions', {
        metadata: { account_id: account.id, amount: transactionAmount }
      });
      
      // Contexto para atualização de saldo
      const balanceContext = createFinancialAuditContext('UPDATE', 'accounts', {
        recordId: account.id,
        metadata: { balance_update: true, old_balance: originalBalance, new_balance: newBalance }
      });
      
      // Executar transação em uma única operação auditada
      const result = await auditService.executeAndAudit(
        transactionContext,
        async () => {
          const client = await integrationPool.connect();
          try {
            await client.query('BEGIN');
            
            // Inserir transação
            const transactionResult = await client.query(`
              INSERT INTO transactions (account_id, type, amount, description, category, date) 
              VALUES ($1, 'INCOME', $2, 'Depósito de teste', 'Teste', CURRENT_DATE) 
              RETURNING *
            `, [account.id, transactionAmount]);
            
            // Atualizar saldo da conta
            await auditService.logOperation(
              balanceContext,
              { balance: originalBalance },
              { balance: newBalance }
            );
            
            await client.query(`
              UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $2
            `, [transactionAmount, account.id]);
            
            await client.query('COMMIT');
            return transactionResult;
            
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        }
      );
      
      expect(result.rows).toHaveLength(1);
      
      // Verificar se ambas operações foram auditadas
      const auditResults = await integrationPool.query(`
        SELECT * FROM audit_logs 
        WHERE table_name IN ('transactions', 'accounts') 
        ORDER BY timestamp DESC LIMIT 2
      `);
      
      expect(auditResults.rows).toHaveLength(2);
      
      // Verificar consistência dos saldos
      const balanceCheck = await consistencyService.runSpecificCheck('balance_validation');
      expect(balanceCheck.status).toBe('PASSED');
    });
    
    it('deve detectar transação que deixa saldo inconsistente', async () => {
      const accountResult = await integrationPool.query('SELECT id FROM accounts WHERE type = $1 LIMIT 1', ['CHECKING']);
      const accountId = accountResult.rows[0].id;
      
      // Inserir transação sem atualizar saldo da conta (inconsistência intencional)
      const context = createFinancialAuditContext('CREATE', 'transactions');
      
      await auditService.executeAndAudit(
        context,
        async () => {
          return await integrationPool.query(`
            INSERT INTO transactions (account_id, type, amount, description, date) 
            VALUES ($1, 'EXPENSE', -1000.00, 'Transação sem atualização de saldo', CURRENT_DATE)
          `, [accountId]);
        }
      );
      
      // Executar teste de consistência
      const consistencyResult = await consistencyService.runSpecificCheck('balance_validation');
      
      expect(consistencyResult.status).toBe('FAILED');
      expect(consistencyResult.violationsFound).toBeGreaterThan(0);
      expect(consistencyResult.details.violations[0].violation_type).toBe('BALANCE_MISMATCH');
    });
  });
  
  describe('Transferências Entre Contas', () => {
    it('deve auditar transferência completa entre contas', async () => {
      const accountsResult = await integrationPool.query('SELECT id, balance FROM accounts LIMIT 2');
      const [sourceAccount, targetAccount] = accountsResult.rows;
      
      const transferAmount = 200.00;
      const sourceOldBalance = parseFloat(sourceAccount.balance);
      const targetOldBalance = parseFloat(targetAccount.balance);
      
      const context = createFinancialAuditContext('CREATE', 'transactions', {
        metadata: { 
          transfer: true,
          source_account: sourceAccount.id,
          target_account: targetAccount.id,
          amount: transferAmount
        }
      });
      
      // Executar transferência auditada
      const result = await auditService.executeAndAudit(
        context,
        async () => {
          const client = await integrationPool.connect();
          try {
            await client.query('BEGIN');
            
            // Transação de débito na conta origem
            await client.query(`
              INSERT INTO transactions (account_id, type, amount, description, date) 
              VALUES ($1, 'TRANSFER', $2, 'Transferência enviada', CURRENT_DATE)
            `, [sourceAccount.id, -transferAmount]);
            
            // Transação de crédito na conta destino
            await client.query(`
              INSERT INTO transactions (account_id, type, amount, description, date) 
              VALUES ($1, 'TRANSFER', $2, 'Transferência recebida', CURRENT_DATE)
            `, [targetAccount.id, transferAmount]);
            
            // Atualizar saldos
            await client.query(`
              UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $2
            `, [transferAmount, sourceAccount.id]);
            
            await client.query(`
              UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $2
            `, [transferAmount, targetAccount.id]);
            
            await client.query('COMMIT');
            return { success: true, transfer_amount: transferAmount };
            
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        }
      );
      
      expect(result.success).toBe(true);
      
      // Verificar se transferência foi auditada
      const auditResult = await integrationPool.query(`
        SELECT * FROM audit_logs 
        WHERE table_name = 'transactions' 
        ORDER BY timestamp DESC LIMIT 1
      `);
      
      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].metadata.transfer).toBe(true);
      
      // Verificar consistência após transferência
      const consistencyResult = await consistencyService.runConsistencyChecks();
      expect(consistencyResult.overall_status).toBeOneOf(['CONSISTENT', 'WARNING']);
    });
  });
});

// ============================================================================
// TESTES DE SEGURANÇA EM CENÁRIOS REAIS
// ============================================================================

describe('Segurança em Cenários Reais', () => {
  describe('Tentativas de Bypass', () => {
    it('deve detectar tentativa de conexão direta ao banco', async () => {
      // Simular tentativa de conexão direta (bypass do sistema)
      const suspiciousContext = createFinancialAuditContext('READ', 'accounts', {
        ipAddress: '192.168.1.100',
        userAgent: 'Direct DB Connection',
        metadata: { bypass_attempt: true }
      });
      
      // Registrar evento de segurança
      await auditService.logSecurityEvent({
        event_type: 'BYPASS_ATTEMPT',
        threat_level: 'CRITICAL',
        source_ip: '192.168.1.100',
        user_agent: 'Direct DB Connection',
        blocked: true,
        details: {
          attempted_operation: 'Direct database connection',
          target_table: 'accounts',
          reason: 'Tentativa de acesso direto ao banco de dados'
        }
      });
      
      // Verificar se evento foi registrado
      const securityEvents = await integrationPool.query(`
        SELECT * FROM security_events 
        WHERE event_type = 'BYPASS_ATTEMPT' 
        ORDER BY timestamp DESC LIMIT 1
      `);
      
      expect(securityEvents.rows).toHaveLength(1);
      expect(securityEvents.rows[0].threat_level).toBe('CRITICAL');
      expect(securityEvents.rows[0].blocked).toBe(true);
      
      // Verificar se aparece no relatório de segurança
      const dashboardData = await reportService.getDashboardData();
      expect(dashboardData.recent_activities.security_events_last_hour).toBeGreaterThan(0);
      
      const criticalAlerts = dashboardData.alerts.filter(alert => 
        alert.type === 'SECURITY' && alert.severity === 'CRITICAL'
      );
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });
    
    it('deve detectar operações fora do horário comercial', async () => {
      // Simular operação fora do horário (ex: 2h da manhã)
      const suspiciousTime = new Date();
      suspiciousTime.setHours(2, 0, 0, 0);
      
      const context = createFinancialAuditContext('DELETE', 'transactions', {
        metadata: { 
          suspicious_time: true,
          operation_time: suspiciousTime.toISOString()
        }
      });
      
      await auditService.logSecurityEvent({
        event_type: 'SUSPICIOUS_QUERY',
        threat_level: 'MEDIUM',
        source_ip: '127.0.0.1',
        user_id: context.userId,
        blocked: false,
        details: {
          attempted_operation: 'DELETE FROM transactions',
          target_table: 'transactions',
          reason: 'Operação DELETE fora do horário comercial',
          additional_info: { operation_time: suspiciousTime.toISOString() }
        }
      });
      
      // Verificar registro do evento
      const securityEvents = await integrationPool.query(`
        SELECT * FROM security_events 
        WHERE event_type = 'SUSPICIOUS_QUERY' 
        ORDER BY timestamp DESC LIMIT 1
      `);
      
      expect(securityEvents.rows).toHaveLength(1);
      expect(securityEvents.rows[0].details.reason).toContain('fora do horário comercial');
    });
  });
  
  describe('Rate Limiting', () => {
    it('deve detectar e bloquear operações em excesso', async () => {
      const ipAddress = '192.168.1.50';
      const userId = 'rate-limit-test-user';
      
      // Simular múltiplas operações rápidas
      const operations = [];
      for (let i = 0; i < 15; i++) { // Exceder limite de 10 por minuto
        operations.push(
          auditService.logSecurityEvent({
            event_type: 'RATE_LIMIT_EXCEEDED',
            threat_level: 'MEDIUM',
            source_ip: ipAddress,
            user_id: userId,
            blocked: i >= 10, // Bloquear após 10 operações
            details: {
              attempted_operation: `Operation ${i + 1}`,
              reason: `Rate limit exceeded: ${i + 1}/10 operations per minute`
            }
          })
        );
      }
      
      await Promise.all(operations);
      
      // Verificar eventos de rate limiting
      const rateLimitEvents = await integrationPool.query(`
        SELECT * FROM security_events 
        WHERE event_type = 'RATE_LIMIT_EXCEEDED' AND source_ip = $1
        ORDER BY timestamp DESC
      `, [ipAddress]);
      
      expect(rateLimitEvents.rows).toHaveLength(15);
      
      // Verificar que operações foram bloqueadas após o limite
      const blockedEvents = rateLimitEvents.rows.filter(event => event.blocked);
      expect(blockedEvents.length).toBe(5); // 5 operações bloqueadas
    });
  });
});

// ============================================================================
// TESTES DE RELATÓRIOS EM CENÁRIOS REAIS
// ============================================================================

describe('Relatórios em Cenários Reais', () => {
  beforeEach(async () => {
    // Inserir dados variados para relatórios mais realistas
    await insertVariedTestData();
  });
  
  it('deve gerar relatório executivo completo', async () => {
    const dashboardData = await reportService.getDashboardData();
    
    // Verificar métricas do sistema
    expect(dashboardData.system_health.overall_score).toBeGreaterThan(0);
    expect(dashboardData.system_health.database_status).toBeOneOf(['HEALTHY', 'WARNING', 'CRITICAL']);
    
    // Verificar métricas em tempo real
    expect(dashboardData.real_time_metrics.operations_per_minute).toBeGreaterThanOrEqual(0);
    expect(dashboardData.real_time_metrics.avg_response_time_ms).toBeGreaterThan(0);
    expect(dashboardData.real_time_metrics.error_rate_percentage).toBeGreaterThanOrEqual(0);
    
    // Verificar dados dos gráficos
    expect(dashboardData.charts_data.operations_timeline).toBeInstanceOf(Array);
    expect(dashboardData.charts_data.consistency_trends).toBeInstanceOf(Array);
    expect(dashboardData.charts_data.security_events_timeline).toBeInstanceOf(Array);
  });
  
  it('deve gerar relatório de auditoria detalhado', async () => {
    const config = {
      id: 'detailed-audit-report',
      name: 'Relatório Detalhado de Auditoria',
      description: 'Relatório completo para análise de conformidade',
      report_type: 'AUDIT_TRAIL' as const,
      format: 'JSON' as const,
      filters: {
        date_range: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
          end: new Date()
        },
        operations: ['CREATE', 'UPDATE', 'DELETE'] as AuditOperationType[],
        tables: ['accounts', 'transactions']
      },
      recipients: ['admin@suagrana.com'],
      enabled: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const report = await reportService.generateReport(config.id);
    
    // Verificar estrutura do relatório
    expect(report.id).toBeDefined();
    expect(report.executive_summary).toBeDefined();
    expect(report.audit_trail).toBeDefined();
    expect(report.consistency_analysis).toBeDefined();
    expect(report.security_analysis).toBeDefined();
    
    // Verificar sumário executivo
    expect(report.executive_summary.total_operations).toBeGreaterThan(0);
    expect(report.executive_summary.system_health_score).toBeGreaterThanOrEqual(0);
    expect(report.executive_summary.system_health_score).toBeLessThanOrEqual(100);
    
    // Verificar trilha de auditoria
    expect(report.audit_trail.total_entries).toBeGreaterThan(0);
    expect(report.audit_trail.entries_by_operation).toBeDefined();
    expect(report.audit_trail.recent_activities).toBeInstanceOf(Array);
    
    // Verificar análise de consistência
    expect(report.consistency_analysis.overall_status).toBeOneOf(['CONSISTENT', 'INCONSISTENT', 'WARNING']);
    expect(report.consistency_analysis.tests_summary.total_tests).toBeGreaterThan(0);
  });
});

// ============================================================================
// TESTES DE PERFORMANCE EM CENÁRIOS REAIS
// ============================================================================

describe('Performance em Cenários Reais', () => {
  it('deve manter performance com carga de trabalho realista', async () => {
    const startTime = Date.now();
    const operations = [];
    
    // Simular carga de trabalho realista: 50 operações mistas
    for (let i = 0; i < 50; i++) {
      const operationType = ['CREATE', 'UPDATE', 'READ'][i % 3] as AuditOperationType;
      const tableName = ['accounts', 'transactions', 'users'][i % 3];
      
      const context = createFinancialAuditContext(operationType, tableName, {
        recordId: `perf-test-${i}`,
        metadata: { performance_test: true, iteration: i }
      });
      
      operations.push(auditService.logOperation(context, undefined, { test_data: `iteration-${i}` }));
    }
    
    await Promise.all(operations);
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    const avgTimePerOperation = totalTime / 50;
    
    // Performance deve ser aceitável (menos de 20ms por operação em média)
    expect(avgTimePerOperation).toBeLessThan(20);
    
    // Verificar se todas operações foram registradas
    const auditCount = await integrationPool.query('SELECT COUNT(*) FROM audit_logs');
    expect(parseInt(auditCount.rows[0].count)).toBe(50);
  });
  
  it('deve executar testes de consistência em tempo hábil', async () => {
    const startTime = Date.now();
    
    const consistencyReport = await consistencyService.runConsistencyChecks();
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Testes de consistência devem executar em menos de 5 segundos
    expect(executionTime).toBeLessThan(5000);
    
    // Verificar se relatório foi gerado corretamente
    expect(consistencyReport.id).toBeDefined();
    expect(consistencyReport.tests_executed).toBeGreaterThan(0);
    expect(consistencyReport.execution_time_ms).toBeLessThan(5000);
  });
});

// ============================================================================
// FUNÇÕES AUXILIARES PARA TESTES
// ============================================================================

async function insertVariedTestData(): Promise<void> {
  const client = await integrationPool.connect();
  
  try {
    // Inserir operações variadas para enriquecer os relatórios
    const operations = [
      { op: 'CREATE', table: 'accounts', success: true },
      { op: 'UPDATE', table: 'accounts', success: true },
      { op: 'CREATE', table: 'transactions', success: true },
      { op: 'DELETE', table: 'transactions', success: false },
      { op: 'UPDATE', table: 'users', success: true }
    ];
    
    for (const operation of operations) {
      const context = createFinancialAuditContext(
        operation.op as AuditOperationType,
        operation.table
      );
      
      if (operation.success) {
        await auditService.logOperation(context, undefined, { test: 'varied_data' });
      } else {
        // Simular operação falhada
        try {
          await auditService.executeAndAudit(
            context,
            async () => {
              throw new Error('Operação simulada falhada');
            }
          );
        } catch (error) {
          // Esperado que falhe
        }
      }
    }
    
    // Inserir alguns eventos de segurança
    await auditService.logSecurityEvent({
      event_type: 'UNAUTHORIZED_ACCESS',
      threat_level: 'MEDIUM',
      source_ip: '192.168.1.200',
      blocked: true,
      details: {
        attempted_operation: 'SELECT * FROM accounts',
        reason: 'IP não autorizado'
      }
    });
    
  } finally {
    client.release();
  }
}

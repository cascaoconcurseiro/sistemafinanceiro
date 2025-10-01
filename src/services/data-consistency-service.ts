// =====================================================
// SERVIÇO DE TESTES DE CONSISTÊNCIA DE DADOS
// =====================================================

import { db } from '../config/database';
import { databaseAuditService } from './database-audit-service';
import { eventSystem } from '../events/event-system';
import { UUID, Decimal, TimestampString } from '../types/database';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface ConsistencyTestResult {
  id: UUID;
  test_name: string;
  test_type: 'balance_verification' | 'referential_integrity' | 'data_completeness' | 'business_rules' | 'orphan_records';
  status: 'passed' | 'failed' | 'warning' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expected_value?: any;
  actual_value?: any;
  difference?: any;
  affected_records: number;
  table_names: string[];
  execution_time_ms: number;
  timestamp: TimestampString;
  details: Record<string, any>;
  recommendations?: string[];
}

export interface DataSnapshot {
  id: UUID;
  snapshot_type: 'full' | 'incremental' | 'verification';
  tables: Record<string, any[]>;
  metadata: {
    total_records: number;
    tables_count: number;
    creation_time_ms: number;
    checksum: string;
  };
  timestamp: TimestampString;
}

export interface ConsistencyReport {
  id: UUID;
  report_type: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  test_results: ConsistencyTestResult[];
  summary: {
    total_tests: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
    critical_issues: number;
    overall_status: 'healthy' | 'warning' | 'critical';
  };
  recommendations: string[];
  execution_time_ms: number;
  timestamp: TimestampString;
}

// =====================================================
// CLASSE PRINCIPAL DO SERVIÇO
// =====================================================

export class DataConsistencyService {
  private static instance: DataConsistencyService;
  private isRunning = false;
  private lastSnapshot?: DataSnapshot;
  private testSchedule = new Map<string, NodeJS.Timeout>();

  public static getInstance(): DataConsistencyService {
    if (!DataConsistencyService.instance) {
      DataConsistencyService.instance = new DataConsistencyService();
    }
    return DataConsistencyService.instance;
  }

  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  public async initialize(): Promise<void> {
    try {
      // Criar tabelas de consistência se não existirem
      await this.createConsistencyTables();
      
      // Configurar testes automáticos
      await this.scheduleAutomaticTests();
      
      // Criar snapshot inicial
      await this.createDataSnapshot('full');
      
      console.log('✅ DataConsistencyService inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar DataConsistencyService:', error);
      throw error;
    }
  }

  // =====================================================
  // TESTES DE CONSISTÊNCIA PRINCIPAIS
  // =====================================================

  public async runAllConsistencyTests(): Promise<ConsistencyReport> {
    if (this.isRunning) {
      throw new Error('Testes de consistência já estão em execução');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const reportId = this.generateUUID();

    try {
      console.log('🔍 Iniciando testes de consistência...');

      const testResults: ConsistencyTestResult[] = [];

      // 1. Teste de Integridade Referencial
      const referentialTest = await this.testReferentialIntegrity();
      testResults.push(referentialTest);

      // 2. Teste de Saldos de Contas
      const balanceTest = await this.testAccountBalances();
      testResults.push(balanceTest);

      // 3. Teste de Transações Órfãs
      const orphanTest = await this.testOrphanRecords();
      testResults.push(orphanTest);

      // 4. Teste de Completude de Dados
      const completenessTest = await this.testDataCompleteness();
      testResults.push(completenessTest);

      // 5. Teste de Regras de Negócio
      const businessRulesTest = await this.testBusinessRules();
      testResults.push(businessRulesTest);

      // 6. Teste de Duplicatas
      const duplicatesTest = await this.testDuplicateRecords();
      testResults.push(duplicatesTest);

      // 7. Teste de Consistência Temporal
      const temporalTest = await this.testTemporalConsistency();
      testResults.push(temporalTest);

      // Calcular resumo
      const summary = this.calculateSummary(testResults);
      const executionTime = Date.now() - startTime;

      // Gerar recomendações
      const recommendations = this.generateRecommendations(testResults);

      const report: ConsistencyReport = {
        id: reportId,
        report_type: 'on_demand',
        test_results: testResults,
        summary,
        recommendations,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      };

      // Salvar relatório
      await this.saveConsistencyReport(report);

      // Emitir evento
      eventSystem.emit('consistency_report_generated', report);

      console.log(`✅ Testes de consistência concluídos em ${executionTime}ms`);
      console.log(`📊 Resumo: ${summary.passed} passou, ${summary.failed} falhou, ${summary.warnings} avisos`);

      return report;

    } finally {
      this.isRunning = false;
    }
  }

  // =====================================================
  // TESTES ESPECÍFICOS
  // =====================================================

  private async testReferentialIntegrity(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const issues: any[] = [];

      // Verificar transações com contas inexistentes
      const orphanTransactions = await db.query(`
        SELECT t.id, t.account_id, t.transfer_to_account_id
        FROM transactions t
        LEFT JOIN accounts a1 ON t.account_id = a1.id
        LEFT JOIN accounts a2 ON t.transfer_to_account_id = a2.id
        WHERE (t.account_id IS NOT NULL AND a1.id IS NULL)
           OR (t.transfer_to_account_id IS NOT NULL AND a2.id IS NULL)
      `);

      if (orphanTransactions.rows.length > 0) {
        issues.push({
          type: 'orphan_transactions',
          count: orphanTransactions.rows.length,
          records: orphanTransactions.rows
        });
      }

      // Verificar transações com categorias inexistentes
      const orphanCategories = await db.query(`
        SELECT t.id, t.category_id
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.category_id IS NOT NULL AND c.id IS NULL
      `);

      if (orphanCategories.rows.length > 0) {
        issues.push({
          type: 'orphan_categories',
          count: orphanCategories.rows.length,
          records: orphanCategories.rows
        });
      }

      // Verificar contas com usuários inexistentes
      const orphanAccounts = await db.query(`
        SELECT a.id, a.user_id
        FROM accounts a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE u.id IS NULL
      `);

      if (orphanAccounts.rows.length > 0) {
        issues.push({
          type: 'orphan_accounts',
          count: orphanAccounts.rows.length,
          records: orphanAccounts.rows
        });
      }

      const executionTime = Date.now() - startTime;
      const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);

      return {
        id: testId,
        test_name: 'Integridade Referencial',
        test_type: 'referential_integrity',
        status: totalIssues === 0 ? 'passed' : 'failed',
        severity: totalIssues === 0 ? 'low' : totalIssues > 10 ? 'critical' : 'medium',
        description: totalIssues === 0 
          ? 'Todas as referências estão íntegras'
          : `Encontradas ${totalIssues} violações de integridade referencial`,
        affected_records: totalIssues,
        table_names: ['transactions', 'accounts', 'categories', 'users'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { issues },
        recommendations: totalIssues > 0 ? [
          'Corrigir referências órfãs',
          'Implementar constraints de chave estrangeira',
          'Revisar processo de exclusão de registros'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Integridade Referencial', 'referential_integrity', error, Date.now() - startTime);
    }
  }

  private async testAccountBalances(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const balanceIssues: any[] = [];

      // Calcular saldos baseados em transações
      const calculatedBalances = await db.query(`
        SELECT 
          a.id as account_id,
          a.name as account_name,
          a.initial_balance,
          COALESCE(SUM(
            CASE 
              WHEN t.type = 'income' THEN t.amount
              WHEN t.type = 'expense' THEN -t.amount
              WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
              WHEN t.type = 'transfer' AND t.transfer_to_account_id = a.id THEN t.amount
              ELSE 0
            END
          ), 0) as transaction_total,
          (a.initial_balance + COALESCE(SUM(
            CASE 
              WHEN t.type = 'income' THEN t.amount
              WHEN t.type = 'expense' THEN -t.amount
              WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
              WHEN t.type = 'transfer' AND t.transfer_to_account_id = a.id THEN t.amount
              ELSE 0
            END
          ), 0)) as calculated_balance,
          a.current_balance as stored_balance
        FROM accounts a
        LEFT JOIN transactions t ON (t.account_id = a.id OR t.transfer_to_account_id = a.id)
          AND t.is_deleted = false
        WHERE a.is_deleted = false
        GROUP BY a.id, a.name, a.initial_balance, a.current_balance
      `);

      for (const row of calculatedBalances.rows) {
        const difference = Math.abs(row.calculated_balance - row.stored_balance);
        if (difference > 0.01) { // Tolerância de 1 centavo para arredondamentos
          balanceIssues.push({
            account_id: row.account_id,
            account_name: row.account_name,
            calculated_balance: row.calculated_balance,
            stored_balance: row.stored_balance,
            difference: difference
          });
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        id: testId,
        test_name: 'Saldos de Contas',
        test_type: 'balance_verification',
        status: balanceIssues.length === 0 ? 'passed' : 'failed',
        severity: balanceIssues.length === 0 ? 'low' : 'high',
        description: balanceIssues.length === 0 
          ? 'Todos os saldos estão corretos'
          : `Encontradas ${balanceIssues.length} inconsistências de saldo`,
        affected_records: balanceIssues.length,
        table_names: ['accounts', 'transactions'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { balance_issues: balanceIssues },
        recommendations: balanceIssues.length > 0 ? [
          'Recalcular saldos das contas afetadas',
          'Verificar transações duplicadas ou perdidas',
          'Implementar validação de saldo em tempo real'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Saldos de Contas', 'balance_verification', error, Date.now() - startTime);
    }
  }

  private async testOrphanRecords(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const orphanIssues: any[] = [];

      // Verificar transações sem grupo de transferência válido
      const orphanTransfers = await db.query(`
        SELECT t1.id, t1.transfer_group_id
        FROM transactions t1
        WHERE t1.type = 'transfer' 
          AND t1.transfer_group_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM transactions t2 
            WHERE t2.transfer_group_id = t1.transfer_group_id 
              AND t2.id != t1.id
          )
      `);

      if (orphanTransfers.rows.length > 0) {
        orphanIssues.push({
          type: 'orphan_transfers',
          count: orphanTransfers.rows.length,
          records: orphanTransfers.rows
        });
      }

      // Verificar parcelas sem grupo válido
      const orphanInstallments = await db.query(`
        SELECT t1.id, t1.installment_group_id
        FROM transactions t1
        WHERE t1.installment_group_id IS NOT NULL
          AND t1.total_installments > 1
          AND (
            SELECT COUNT(*) FROM transactions t2 
            WHERE t2.installment_group_id = t1.installment_group_id
          ) != t1.total_installments
      `);

      if (orphanInstallments.rows.length > 0) {
        orphanIssues.push({
          type: 'orphan_installments',
          count: orphanInstallments.rows.length,
          records: orphanInstallments.rows
        });
      }

      const executionTime = Date.now() - startTime;
      const totalOrphans = orphanIssues.reduce((sum, issue) => sum + issue.count, 0);

      return {
        id: testId,
        test_name: 'Registros Órfãos',
        test_type: 'orphan_records',
        status: totalOrphans === 0 ? 'passed' : 'failed',
        severity: totalOrphans === 0 ? 'low' : 'medium',
        description: totalOrphans === 0 
          ? 'Nenhum registro órfão encontrado'
          : `Encontrados ${totalOrphans} registros órfãos`,
        affected_records: totalOrphans,
        table_names: ['transactions'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { orphan_issues: orphanIssues },
        recommendations: totalOrphans > 0 ? [
          'Corrigir ou remover registros órfãos',
          'Implementar validação de integridade de grupos',
          'Revisar processo de criação de transações relacionadas'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Registros Órfãos', 'orphan_records', error, Date.now() - startTime);
    }
  }

  private async testDataCompleteness(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const completenessIssues: any[] = [];

      // Verificar transações sem descrição
      const emptyDescriptions = await db.query(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE (description IS NULL OR TRIM(description) = '') 
          AND is_deleted = false
      `);

      if (emptyDescriptions.rows[0].count > 0) {
        completenessIssues.push({
          type: 'empty_descriptions',
          count: emptyDescriptions.rows[0].count,
          table: 'transactions'
        });
      }

      // Verificar contas sem nome
      const emptyAccountNames = await db.query(`
        SELECT COUNT(*) as count FROM accounts 
        WHERE (name IS NULL OR TRIM(name) = '') 
          AND is_deleted = false
      `);

      if (emptyAccountNames.rows[0].count > 0) {
        completenessIssues.push({
          type: 'empty_account_names',
          count: emptyAccountNames.rows[0].count,
          table: 'accounts'
        });
      }

      // Verificar usuários sem email
      const emptyEmails = await db.query(`
        SELECT COUNT(*) as count FROM users 
        WHERE (email IS NULL OR TRIM(email) = '') 
          AND is_deleted = false
      `);

      if (emptyEmails.rows[0].count > 0) {
        completenessIssues.push({
          type: 'empty_emails',
          count: emptyEmails.rows[0].count,
          table: 'users'
        });
      }

      const executionTime = Date.now() - startTime;
      const totalIssues = completenessIssues.reduce((sum, issue) => sum + issue.count, 0);

      return {
        id: testId,
        test_name: 'Completude de Dados',
        test_type: 'data_completeness',
        status: totalIssues === 0 ? 'passed' : 'warning',
        severity: totalIssues === 0 ? 'low' : 'medium',
        description: totalIssues === 0 
          ? 'Todos os campos obrigatórios estão preenchidos'
          : `Encontrados ${totalIssues} campos obrigatórios vazios`,
        affected_records: totalIssues,
        table_names: ['transactions', 'accounts', 'users'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { completeness_issues: completenessIssues },
        recommendations: totalIssues > 0 ? [
          'Preencher campos obrigatórios vazios',
          'Implementar validação de campos obrigatórios',
          'Revisar processo de entrada de dados'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Completude de Dados', 'data_completeness', error, Date.now() - startTime);
    }
  }

  private async testBusinessRules(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const ruleViolations: any[] = [];

      // Verificar transações com valores negativos (exceto transferências)
      const negativeAmounts = await db.query(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE amount < 0 AND type != 'transfer' AND is_deleted = false
      `);

      if (negativeAmounts.rows[0].count > 0) {
        ruleViolations.push({
          rule: 'positive_amounts',
          count: negativeAmounts.rows[0].count,
          description: 'Transações com valores negativos'
        });
      }

      // Verificar transferências sem conta de destino
      const invalidTransfers = await db.query(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE type = 'transfer' AND transfer_to_account_id IS NULL AND is_deleted = false
      `);

      if (invalidTransfers.rows[0].count > 0) {
        ruleViolations.push({
          rule: 'transfer_destination',
          count: invalidTransfers.rows[0].count,
          description: 'Transferências sem conta de destino'
        });
      }

      // Verificar datas futuras em transações
      const futureDates = await db.query(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE transaction_date > CURRENT_DATE + INTERVAL '1 day' AND is_deleted = false
      `);

      if (futureDates.rows[0].count > 0) {
        ruleViolations.push({
          rule: 'future_dates',
          count: futureDates.rows[0].count,
          description: 'Transações com datas muito futuras'
        });
      }

      const executionTime = Date.now() - startTime;
      const totalViolations = ruleViolations.reduce((sum, violation) => sum + violation.count, 0);

      return {
        id: testId,
        test_name: 'Regras de Negócio',
        test_type: 'business_rules',
        status: totalViolations === 0 ? 'passed' : 'warning',
        severity: totalViolations === 0 ? 'low' : 'medium',
        description: totalViolations === 0 
          ? 'Todas as regras de negócio estão sendo respeitadas'
          : `Encontradas ${totalViolations} violações de regras de negócio`,
        affected_records: totalViolations,
        table_names: ['transactions'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { rule_violations: ruleViolations },
        recommendations: totalViolations > 0 ? [
          'Corrigir violações de regras de negócio',
          'Implementar validação mais rigorosa na entrada de dados',
          'Revisar regras de negócio com stakeholders'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Regras de Negócio', 'business_rules', error, Date.now() - startTime);
    }
  }

  private async testDuplicateRecords(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const duplicateIssues: any[] = [];

      // Verificar transações duplicadas (mesmo valor, data, conta e descrição)
      const duplicateTransactions = await db.query(`
        SELECT 
          amount, transaction_date, account_id, description, COUNT(*) as count
        FROM transactions 
        WHERE is_deleted = false
        GROUP BY amount, transaction_date, account_id, description
        HAVING COUNT(*) > 1
      `);

      if (duplicateTransactions.rows.length > 0) {
        duplicateIssues.push({
          type: 'duplicate_transactions',
          count: duplicateTransactions.rows.length,
          records: duplicateTransactions.rows
        });
      }

      // Verificar contas duplicadas (mesmo nome e usuário)
      const duplicateAccounts = await db.query(`
        SELECT 
          name, user_id, COUNT(*) as count
        FROM accounts 
        WHERE is_deleted = false
        GROUP BY name, user_id
        HAVING COUNT(*) > 1
      `);

      if (duplicateAccounts.rows.length > 0) {
        duplicateIssues.push({
          type: 'duplicate_accounts',
          count: duplicateAccounts.rows.length,
          records: duplicateAccounts.rows
        });
      }

      const executionTime = Date.now() - startTime;
      const totalDuplicates = duplicateIssues.reduce((sum, issue) => sum + issue.count, 0);

      return {
        id: testId,
        test_name: 'Registros Duplicados',
        test_type: 'business_rules',
        status: totalDuplicates === 0 ? 'passed' : 'warning',
        severity: totalDuplicates === 0 ? 'low' : 'medium',
        description: totalDuplicates === 0 
          ? 'Nenhum registro duplicado encontrado'
          : `Encontrados ${totalDuplicates} possíveis registros duplicados`,
        affected_records: totalDuplicates,
        table_names: ['transactions', 'accounts'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { duplicate_issues: duplicateIssues },
        recommendations: totalDuplicates > 0 ? [
          'Revisar e consolidar registros duplicados',
          'Implementar validação de duplicatas na entrada',
          'Criar índices únicos onde apropriado'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Registros Duplicados', 'business_rules', error, Date.now() - startTime);
    }
  }

  private async testTemporalConsistency(): Promise<ConsistencyTestResult> {
    const startTime = Date.now();
    const testId = this.generateUUID();

    try {
      const temporalIssues: any[] = [];

      // Verificar registros com created_at posterior a updated_at
      const invalidTimestamps = await db.query(`
        SELECT 'transactions' as table_name, COUNT(*) as count
        FROM transactions 
        WHERE created_at > updated_at AND is_deleted = false
        UNION ALL
        SELECT 'accounts' as table_name, COUNT(*) as count
        FROM accounts 
        WHERE created_at > updated_at AND is_deleted = false
        UNION ALL
        SELECT 'users' as table_name, COUNT(*) as count
        FROM users 
        WHERE created_at > updated_at AND is_deleted = false
      `);

      for (const row of invalidTimestamps.rows) {
        if (row.count > 0) {
          temporalIssues.push({
            table: row.table_name,
            issue: 'created_after_updated',
            count: row.count
          });
        }
      }

      const executionTime = Date.now() - startTime;
      const totalIssues = temporalIssues.reduce((sum, issue) => sum + issue.count, 0);

      return {
        id: testId,
        test_name: 'Consistência Temporal',
        test_type: 'data_completeness',
        status: totalIssues === 0 ? 'passed' : 'warning',
        severity: totalIssues === 0 ? 'low' : 'medium',
        description: totalIssues === 0 
          ? 'Todas as datas estão consistentes'
          : `Encontradas ${totalIssues} inconsistências temporais`,
        affected_records: totalIssues,
        table_names: ['transactions', 'accounts', 'users'],
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { temporal_issues: temporalIssues },
        recommendations: totalIssues > 0 ? [
          'Corrigir timestamps inconsistentes',
          'Implementar validação de datas na aplicação',
          'Revisar triggers de atualização automática'
        ] : undefined
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Consistência Temporal', 'data_completeness', error, Date.now() - startTime);
    }
  }

  // =====================================================
  // SNAPSHOTS DE DADOS
  // =====================================================

  public async createDataSnapshot(type: 'full' | 'incremental' | 'verification'): Promise<DataSnapshot> {
    const startTime = Date.now();
    const snapshotId = this.generateUUID();

    try {
      const tables: Record<string, any[]> = {};
      const tableNames = ['users', 'accounts', 'transactions', 'categories', 'credit_cards'];

      let totalRecords = 0;

      for (const tableName of tableNames) {
        const result = await db.query(`SELECT * FROM ${tableName} WHERE is_deleted = false ORDER BY id`);
        tables[tableName] = result.rows;
        totalRecords += result.rows.length;
      }

      const creationTime = Date.now() - startTime;
      const checksum = this.calculateChecksum(tables);

      const snapshot: DataSnapshot = {
        id: snapshotId,
        snapshot_type: type,
        tables,
        metadata: {
          total_records: totalRecords,
          tables_count: tableNames.length,
          creation_time_ms: creationTime,
          checksum
        },
        timestamp: new Date().toISOString()
      };

      // Salvar snapshot (apenas metadados, dados ficam em memória)
      await this.saveSnapshotMetadata(snapshot);

      this.lastSnapshot = snapshot;
      return snapshot;

    } catch (error) {
      console.error('Erro ao criar snapshot:', error);
      throw error;
    }
  }

  public async compareWithLastSnapshot(): Promise<ConsistencyTestResult> {
    if (!this.lastSnapshot) {
      throw new Error('Nenhum snapshot anterior disponível para comparação');
    }

    const currentSnapshot = await this.createDataSnapshot('verification');
    const testId = this.generateUUID();
    const startTime = Date.now();

    try {
      const differences: any[] = [];

      for (const tableName of Object.keys(this.lastSnapshot.tables)) {
        const oldRecords = this.lastSnapshot.tables[tableName];
        const newRecords = currentSnapshot.tables[tableName];

        const oldMap = new Map(oldRecords.map(r => [r.id, r]));
        const newMap = new Map(newRecords.map(r => [r.id, r]));

        // Registros adicionados
        for (const [id, record] of newMap) {
          if (!oldMap.has(id)) {
            differences.push({
              type: 'added',
              table: tableName,
              record_id: id,
              record
            });
          }
        }

        // Registros removidos
        for (const [id, record] of oldMap) {
          if (!newMap.has(id)) {
            differences.push({
              type: 'removed',
              table: tableName,
              record_id: id,
              record
            });
          }
        }

        // Registros modificados
        for (const [id, newRecord] of newMap) {
          const oldRecord = oldMap.get(id);
          if (oldRecord && JSON.stringify(oldRecord) !== JSON.stringify(newRecord)) {
            differences.push({
              type: 'modified',
              table: tableName,
              record_id: id,
              old_record: oldRecord,
              new_record: newRecord
            });
          }
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        id: testId,
        test_name: 'Comparação com Snapshot Anterior',
        test_type: 'data_completeness',
        status: differences.length === 0 ? 'passed' : 'warning',
        severity: 'low',
        description: differences.length === 0 
          ? 'Nenhuma alteração detectada desde o último snapshot'
          : `Detectadas ${differences.length} alterações desde o último snapshot`,
        affected_records: differences.length,
        table_names: Object.keys(this.lastSnapshot.tables),
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        details: { 
          differences,
          last_snapshot_time: this.lastSnapshot.timestamp,
          current_snapshot_time: currentSnapshot.timestamp
        }
      };

    } catch (error) {
      return this.createErrorResult(testId, 'Comparação com Snapshot', 'data_completeness', error, Date.now() - startTime);
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async createConsistencyTables(): Promise<void> {
    // Tabela de relatórios de consistência
    await db.query(`
      CREATE TABLE IF NOT EXISTS consistency_reports (
        id UUID PRIMARY KEY,
        report_type VARCHAR(20) NOT NULL,
        test_results JSONB NOT NULL,
        summary JSONB NOT NULL,
        recommendations JSONB,
        execution_time_ms INTEGER NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Tabela de snapshots (apenas metadados)
    await db.query(`
      CREATE TABLE IF NOT EXISTS data_snapshots (
        id UUID PRIMARY KEY,
        snapshot_type VARCHAR(20) NOT NULL,
        metadata JSONB NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Índices para performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_consistency_reports_timestamp ON consistency_reports(timestamp)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_data_snapshots_type ON data_snapshots(snapshot_type, timestamp)`);
  }

  private async scheduleAutomaticTests(): Promise<void> {
    // Testes diários às 2:00 AM
    const dailyTest = setInterval(async () => {
      try {
        await this.runAllConsistencyTests();
      } catch (error) {
        console.error('Erro durante teste automático diário:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

    this.testSchedule.set('daily', dailyTest);

    // Testes rápidos a cada hora
    const hourlyTest = setInterval(async () => {
      try {
        await this.testAccountBalances();
        await this.testReferentialIntegrity();
      } catch (error) {
        console.error('Erro durante teste automático horário:', error);
      }
    }, 60 * 60 * 1000); // 1 hora

    this.testSchedule.set('hourly', hourlyTest);
  }

  private calculateSummary(testResults: ConsistencyTestResult[]): ConsistencyReport['summary'] {
    const summary = {
      total_tests: testResults.length,
      passed: testResults.filter(t => t.status === 'passed').length,
      failed: testResults.filter(t => t.status === 'failed').length,
      warnings: testResults.filter(t => t.status === 'warning').length,
      errors: testResults.filter(t => t.status === 'error').length,
      critical_issues: testResults.filter(t => t.severity === 'critical').length,
      overall_status: 'healthy' as const
    };

    if (summary.critical_issues > 0 || summary.failed > 0) {
      summary.overall_status = 'critical';
    } else if (summary.warnings > 0) {
      summary.overall_status = 'warning';
    }

    return summary;
  }

  private generateRecommendations(testResults: ConsistencyTestResult[]): string[] {
    const recommendations = new Set<string>();

    for (const result of testResults) {
      if (result.recommendations) {
        result.recommendations.forEach(rec => recommendations.add(rec));
      }
    }

    // Recomendações gerais baseadas no status
    const failedTests = testResults.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      recommendations.add('Priorizar correção de testes falhados');
      recommendations.add('Implementar monitoramento contínuo de consistência');
    }

    const criticalIssues = testResults.filter(t => t.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.add('Resolver imediatamente problemas críticos');
      recommendations.add('Notificar equipe de desenvolvimento sobre problemas críticos');
    }

    return Array.from(recommendations);
  }

  private createErrorResult(
    id: UUID, 
    testName: string, 
    testType: ConsistencyTestResult['test_type'], 
    error: any, 
    executionTime: number
  ): ConsistencyTestResult {
    return {
      id,
      test_name: testName,
      test_type: testType,
      status: 'error',
      severity: 'high',
      description: `Erro durante execução do teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      affected_records: 0,
      table_names: [],
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      details: { error: error instanceof Error ? error.message : String(error) },
      recommendations: ['Verificar logs de erro', 'Contactar equipe de desenvolvimento']
    };
  }

  private async saveConsistencyReport(report: ConsistencyReport): Promise<void> {
    await db.query(`
      INSERT INTO consistency_reports (
        id, report_type, test_results, summary, recommendations, execution_time_ms, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      report.id,
      report.report_type,
      JSON.stringify(report.test_results),
      JSON.stringify(report.summary),
      JSON.stringify(report.recommendations),
      report.execution_time_ms,
      report.timestamp
    ]);
  }

  private async saveSnapshotMetadata(snapshot: DataSnapshot): Promise<void> {
    await db.query(`
      INSERT INTO data_snapshots (id, snapshot_type, metadata, timestamp)
      VALUES ($1, $2, $3, $4)
    `, [
      snapshot.id,
      snapshot.snapshot_type,
      JSON.stringify(snapshot.metadata),
      snapshot.timestamp
    ]);
  }

  private calculateChecksum(data: Record<string, any[]>): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
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

  public async getConsistencyReports(limit: number = 10): Promise<ConsistencyReport[]> {
    const result = await db.query(`
      SELECT * FROM consistency_reports 
      ORDER BY timestamp DESC 
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      ...row,
      test_results: JSON.parse(row.test_results),
      summary: JSON.parse(row.summary),
      recommendations: JSON.parse(row.recommendations || '[]')
    }));
  }

  public async getLatestConsistencyStatus(): Promise<{
    last_check: string;
    overall_status: 'healthy' | 'warning' | 'critical';
    issues_count: number;
    critical_issues: number;
  }> {
    const result = await db.query(`
      SELECT * FROM consistency_reports 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return {
        last_check: 'never',
        overall_status: 'warning',
        issues_count: 0,
        critical_issues: 0
      };
    }

    const report = result.rows[0];
    const summary = JSON.parse(report.summary);

    return {
      last_check: report.timestamp,
      overall_status: summary.overall_status,
      issues_count: summary.failed + summary.warnings,
      critical_issues: summary.critical_issues
    };
  }

  public stopAutomaticTests(): void {
    for (const [name, timeout] of this.testSchedule) {
      clearInterval(timeout);
      console.log(`⏹️ Teste automático ${name} interrompido`);
    }
    this.testSchedule.clear();
  }
}

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

export const dataConsistencyService = DataConsistencyService.getInstance();

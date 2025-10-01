# 📚 API Reference - Sistema de Auditoria SuaGrana

## 🏗️ DatabaseAuditService

### Constructor

```typescript
constructor(pool: Pool, config?: Partial<AuditSystemConfig>)
```

### Methods

#### `initialize(): Promise<void>`
Inicializa o serviço criando tabelas e triggers necessários.

```typescript
await auditService.initialize();
```

#### `logOperation(context, oldValues?, newValues?): Promise<void>`
Registra uma operação de auditoria.

```typescript
await auditService.logOperation(
  {
    userId: 'user-123',
    sessionId: 'session-456',
    ipAddress: '192.168.1.1',
    operation: 'CREATE',
    tableName: 'accounts',
    recordId: 'account-789'
  },
  null, // valores antigos (para UPDATE/DELETE)
  { name: 'Nova Conta', balance: 1000 } // valores novos
);
```

**Parâmetros:**
- `context: AuditContext` - Contexto da operação
- `oldValues?: any` - Valores antes da operação (opcional)
- `newValues?: any` - Valores após a operação (opcional)

#### `executeAndAudit<T>(context, operation): Promise<T>`
Executa uma operação e a audita automaticamente.

```typescript
const result = await auditService.executeAndAudit(
  context,
  async () => {
    return await pool.query('INSERT INTO accounts (name) VALUES ($1) RETURNING *', ['Test']);
  }
);
```

**Parâmetros:**
- `context: AuditContext` - Contexto da operação
- `operation: () => Promise<T>` - Função que executa a operação

**Retorna:** `Promise<T>` - Resultado da operação

#### `logSecurityEvent(event): Promise<void>`
Registra um evento de segurança.

```typescript
await auditService.logSecurityEvent({
  event_type: 'UNAUTHORIZED_ACCESS',
  threat_level: 'HIGH',
  source_ip: '192.168.1.100',
  blocked: true,
  details: { reason: 'IP não autorizado' }
});
```

**Parâmetros:**
- `event: SecurityEvent` - Dados do evento de segurança

#### `interceptDatabaseAccess(client): Client`
Intercepta e monitora acesso direto ao banco.

```typescript
const monitoredClient = auditService.interceptDatabaseAccess(client);
```

**Parâmetros:**
- `client: Client` - Cliente PostgreSQL

**Retorna:** `Client` - Cliente monitorado

#### `cleanup(retentionDays): Promise<number>`
Remove logs antigos baseado no período de retenção.

```typescript
const deletedCount = await auditService.cleanup(90); // manter 90 dias
```

**Parâmetros:**
- `retentionDays: number` - Dias para manter os logs

**Retorna:** `Promise<number>` - Número de registros removidos

---

## 🔍 DataConsistencyService

### Constructor

```typescript
constructor(pool: Pool, config?: Partial<AuditSystemConfig>)
```

### Methods

#### `initialize(): Promise<void>`
Inicializa o serviço criando tabelas e configurando testes automáticos.

```typescript
await consistencyService.initialize();
```

#### `runConsistencyChecks(): Promise<ConsistencyReport>`
Executa todos os testes de consistência.

```typescript
const report = await consistencyService.runConsistencyChecks();
console.log(`Status: ${report.overall_status}`);
console.log(`Score: ${report.summary.health_score}/100`);
```

**Retorna:** `Promise<ConsistencyReport>` - Relatório completo de consistência

#### `runSpecificCheck(checkName): Promise<ConsistencyTestResult>`
Executa um teste específico de consistência.

```typescript
const result = await consistencyService.runSpecificCheck('referential_integrity');
```

**Parâmetros:**
- `checkName: string` - Nome do teste ('referential_integrity', 'account_balances', 'orphaned_records', 'data_completeness', 'business_rules', 'duplicates', 'temporal_consistency')

**Retorna:** `Promise<ConsistencyTestResult>` - Resultado do teste específico

#### `createDataSnapshot(): Promise<string>`
Cria um snapshot dos dados atuais.

```typescript
const snapshotId = await consistencyService.createDataSnapshot();
```

**Retorna:** `Promise<string>` - ID do snapshot criado

#### `compareSnapshots(snapshot1Id, snapshot2Id): Promise<any>`
Compara dois snapshots de dados.

```typescript
const comparison = await consistencyService.compareSnapshots('snap1', 'snap2');
```

**Parâmetros:**
- `snapshot1Id: string` - ID do primeiro snapshot
- `snapshot2Id: string` - ID do segundo snapshot

**Retorna:** `Promise<any>` - Resultado da comparação

#### `getConsistencyHistory(days): Promise<ConsistencyCheck[]>`
Obtém histórico de verificações de consistência.

```typescript
const history = await consistencyService.getConsistencyHistory(30); // últimos 30 dias
```

**Parâmetros:**
- `days: number` - Número de dias para buscar

**Retorna:** `Promise<ConsistencyCheck[]>` - Array de verificações

---

## 📊 AuditReportService

### Constructor

```typescript
constructor(pool: Pool, config?: Partial<AuditSystemConfig>)
```

### Methods

#### `initialize(): Promise<void>`
Inicializa o serviço criando tabelas e agendando relatórios.

```typescript
await reportService.initialize();
```

#### `generateReport(configId): Promise<AuditReport>`
Gera um relatório de auditoria baseado na configuração.

```typescript
const report = await reportService.generateReport('config-executive-monthly');
```

**Parâmetros:**
- `configId: string` - ID da configuração do relatório

**Retorna:** `Promise<AuditReport>` - Relatório gerado

#### `getDashboardData(): Promise<DashboardData>`
Obtém dados em tempo real para o dashboard.

```typescript
const dashboard = await reportService.getDashboardData();
console.log(`Score do sistema: ${dashboard.system_health.overall_score}`);
```

**Retorna:** `Promise<DashboardData>` - Dados do dashboard

#### `createReportConfig(config): Promise<string>`
Cria uma nova configuração de relatório.

```typescript
const configId = await reportService.createReportConfig({
  name: 'Relatório Mensal',
  description: 'Relatório executivo mensal',
  format: 'PDF',
  schedule: 'monthly',
  recipients: ['admin@suagrana.com'],
  sections: ['executive_summary', 'audit_trail', 'consistency_analysis']
});
```

**Parâmetros:**
- `config: AuditReportConfig` - Configuração do relatório

**Retorna:** `Promise<string>` - ID da configuração criada

#### `scheduleReport(configId, schedule): Promise<void>`
Agenda um relatório para execução automática.

```typescript
await reportService.scheduleReport('config-id', 'daily');
```

**Parâmetros:**
- `configId: string` - ID da configuração
- `schedule: string` - Frequência ('daily', 'weekly', 'monthly')

#### `getReportHistory(limit): Promise<AuditReport[]>`
Obtém histórico de relatórios gerados.

```typescript
const reports = await reportService.getReportHistory(10); // últimos 10 relatórios
```

**Parâmetros:**
- `limit: number` - Número máximo de relatórios

**Retorna:** `Promise<AuditReport[]>` - Array de relatórios

---

## 🛡️ DatabaseSecurityMiddleware

### Functions

#### `databaseSecurityMiddleware(req, res, next)`
Middleware Express para segurança de banco de dados.

```typescript
import { databaseSecurityMiddleware } from '../middleware/database-security-middleware';

app.use(databaseSecurityMiddleware);
```

#### `interceptPoolConnections(pool): Pool`
Intercepta conexões do pool PostgreSQL.

```typescript
const securePool = interceptPoolConnections(pool);
```

**Parâmetros:**
- `pool: Pool` - Pool de conexões PostgreSQL

**Retorna:** `Pool` - Pool interceptado

#### `validateDatabaseOperation(operation, context): boolean`
Valida se uma operação de banco é autorizada.

```typescript
const isValid = validateDatabaseOperation('SELECT * FROM accounts', context);
```

**Parâmetros:**
- `operation: string` - Query SQL
- `context: SecurityContext` - Contexto de segurança

**Retorna:** `boolean` - Se a operação é válida

---

## 📋 Tipos e Interfaces

### AuditContext

```typescript
interface AuditContext {
  userId: string;
  sessionId: string;
  ipAddress: string;
  operation: AuditOperation;
  tableName: string;
  recordId: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}
```

### AuditOperation

```typescript
type AuditOperation = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE';
```

### SecurityEvent

```typescript
interface SecurityEvent {
  event_type: SecurityEventType;
  threat_level: ThreatLevel;
  source_ip: string;
  blocked: boolean;
  details: Record<string, any>;
  user_id?: string;
  session_id?: string;
}
```

### ConsistencyTestResult

```typescript
interface ConsistencyTestResult {
  test_id: string;
  test_name: string;
  status: ConsistencyStatus;
  executed_at: Date;
  execution_time_ms: number;
  violations_found: number;
  details: {
    description: string;
    violations: DataIntegrityViolation[];
    recommendations: string[];
    affected_records: number;
  };
}
```

### DashboardData

```typescript
interface DashboardData {
  system_health: {
    overall_score: number;
    database_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    consistency_score: number;
    security_score: number;
    performance_score: number;
  };
  real_time_metrics: {
    operations_per_minute: number;
    average_response_time_ms: number;
    error_rate_percentage: number;
    active_connections: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  recent_activity: {
    total_operations_today: number;
    failed_operations_today: number;
    security_events_today: number;
    consistency_checks_today: number;
  };
}
```

---

## 🔧 Configuração

### AuditSystemConfig

```typescript
interface AuditSystemConfig {
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
    default_format: 'JSON' | 'PDF' | 'HTML';
    storage_path: string;
    email_notifications: boolean;
  };
}
```

---

## 🚨 Códigos de Erro

### Audit Errors

- `AUDIT_001` - Falha na inicialização do serviço
- `AUDIT_002` - Erro ao registrar operação
- `AUDIT_003` - Contexto de auditoria inválido
- `AUDIT_004` - Falha na interceptação de operação

### Consistency Errors

- `CONS_001` - Falha na execução de teste de consistência
- `CONS_002` - Snapshot inválido ou não encontrado
- `CONS_003` - Erro na comparação de snapshots
- `CONS_004` - Violação de integridade crítica

### Security Errors

- `SEC_001` - Tentativa de bypass detectada
- `SEC_002` - IP bloqueado por rate limiting
- `SEC_003` - Operação não autorizada
- `SEC_004` - Query suspeita detectada

### Report Errors

- `REP_001` - Falha na geração de relatório
- `REP_002` - Configuração de relatório inválida
- `REP_003` - Erro no envio de relatório
- `REP_004` - Dados insuficientes para relatório

---

## 📊 Métricas e Monitoramento

### Métricas Disponíveis

```typescript
// Métricas de auditoria
const auditMetrics = {
  operations_per_second: number,
  audit_log_size_mb: number,
  failed_audits_count: number,
  average_audit_time_ms: number
};

// Métricas de consistência
const consistencyMetrics = {
  last_check_timestamp: Date,
  consistency_score: number, // 0-100
  violations_detected: number,
  checks_per_hour: number
};

// Métricas de segurança
const securityMetrics = {
  blocked_requests_count: number,
  security_events_count: number,
  threat_level_distribution: Record<ThreatLevel, number>,
  unique_ips_blocked: number
};
```

### Health Check Response

```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  services: {
    audit: 'up' | 'down' | 'degraded';
    consistency: 'up' | 'down' | 'degraded';
    security: 'up' | 'down' | 'degraded';
    reporting: 'up' | 'down' | 'degraded';
  };
  metrics: {
    response_time_ms: number;
    memory_usage_mb: number;
    cpu_usage_percent: number;
    database_connections: number;
  };
}
```

---

## 🔗 Exemplos de Uso Avançado

### Auditoria Customizada

```typescript
// Auditoria com contexto personalizado
const customContext: AuditContext = {
  userId: 'admin-user',
  sessionId: 'admin-session',
  ipAddress: '10.0.0.1',
  operation: 'BULK_UPDATE',
  tableName: 'accounts',
  recordId: 'bulk-operation-123',
  additionalData: {
    reason: 'Correção de saldos',
    approved_by: 'supervisor-456',
    batch_size: 1000
  }
};

await auditService.logOperation(customContext, oldData, newData);
```

### Relatório Personalizado

```typescript
const customReportConfig: AuditReportConfig = {
  name: 'Relatório de Segurança Semanal',
  description: 'Análise semanal de eventos de segurança',
  format: 'PDF',
  schedule: 'weekly',
  recipients: ['security@suagrana.com', 'admin@suagrana.com'],
  sections: ['security_analysis', 'threat_assessment'],
  filters: {
    date_range: { start: '2024-01-01', end: '2024-01-07' },
    severity: ['HIGH', 'CRITICAL'],
    event_types: ['UNAUTHORIZED_ACCESS', 'SUSPICIOUS_QUERY']
  }
};

const configId = await reportService.createReportConfig(customReportConfig);
```

### Teste de Consistência Personalizado

```typescript
// Implementar teste customizado
class CustomConsistencyTest {
  async validateBusinessRule(): Promise<ConsistencyTestResult> {
    // Lógica específica do negócio
    const violations = await this.checkCustomRule();
    
    return {
      test_id: 'custom-business-rule',
      test_name: 'Validação de Regra de Negócio Customizada',
      status: violations.length > 0 ? 'FAILED' : 'PASSED',
      executed_at: new Date(),
      execution_time_ms: 150,
      violations_found: violations.length,
      details: {
        description: 'Verifica regras específicas do SuaGrana',
        violations,
        recommendations: ['Corrigir dados inconsistentes'],
        affected_records: violations.length
      }
    };
  }
}
```

---

**📝 Nota**: Esta API está em constante evolução. Consulte sempre a documentação mais recente e os tipos TypeScript para informações atualizadas.
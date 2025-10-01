# Sistema de Auditoria e Consistência de Dados - SuaGrana

## 📋 Visão Geral

O Sistema de Auditoria e Consistência de Dados do SuaGrana foi desenvolvido para garantir que o banco PostgreSQL/Neon seja a **única fonte de verdade** para todos os dados financeiros. Este sistema implementa controles rigorosos, auditoria completa e testes de consistência para assegurar a integridade dos dados.

## 🎯 Objetivos Principais

- ✅ **Fonte Única de Verdade**: Garantir que todos os dados sejam manipulados apenas através do banco de dados
- 🔍 **Auditoria Completa**: Registrar todas as operações com detalhes completos
- 🛡️ **Segurança Avançada**: Detectar e bloquear tentativas de bypass ou acesso não autorizado
- 📊 **Consistência de Dados**: Validar continuamente a integridade dos dados
- 📈 **Relatórios Detalhados**: Fornecer insights e métricas sobre o sistema
- 🚨 **Alertas em Tempo Real**: Notificar sobre violações e inconsistências

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO SUAGRANA                       │
├─────────────────────────────────────────────────────────────┤
│  🔒 Security Middleware  │  📝 Audit Service               │
│  🔍 Consistency Service  │  📊 Report Service              │
├─────────────────────────────────────────────────────────────┤
│                    POSTGRESQL/NEON                         │
│  📋 audit_logs          │  🛡️ security_events             │
│  ✅ consistency_checks  │  📈 audit_reports               │
└─────────────────────────────────────────────────────────────┘
```

### Serviços Implementados

1. **DatabaseAuditService** - Auditoria central de operações
2. **DataConsistencyService** - Testes de consistência e integridade
3. **AuditReportService** - Geração de relatórios e dashboards
4. **DatabaseSecurityMiddleware** - Segurança e detecção de bypass

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

```bash
# Node.js 18+ e PostgreSQL 14+
npm install pg @types/pg
npm install --save-dev jest @types/jest
```

### 2. Configuração do Banco de Dados

```sql
-- Executar no PostgreSQL/Neon
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3. Inicialização dos Serviços

```typescript
import { Pool } from 'pg';
import { DatabaseAuditService } from './services/database-audit-service';
import { DataConsistencyService } from './services/data-consistency-service';
import { AuditReportService } from './services/audit-report-service';

// Configurar conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar serviços
const auditService = new DatabaseAuditService(pool);
const consistencyService = new DataConsistencyService(pool);
const reportService = new AuditReportService(pool);

// Inicializar (criar tabelas e triggers)
await auditService.initialize();
await consistencyService.initialize();
await reportService.initialize();
```

## 📝 Guia de Uso

### Auditoria de Operações

#### Operação Simples
```typescript
import { AuditContext } from './types/audit-system';

const context: AuditContext = {
  userId: 'user-123',
  sessionId: 'session-456',
  ipAddress: '192.168.1.1',
  operation: 'CREATE',
  tableName: 'accounts',
  recordId: 'account-789'
};

// Registrar operação
await auditService.logOperation(
  context,
  undefined, // valores antigos (para UPDATE/DELETE)
  { name: 'Nova Conta', balance: 1000 } // valores novos
);
```

#### Operação com Interceptação
```typescript
// Executar e auditar automaticamente
const result = await auditService.executeAndAudit(
  context,
  async () => {
    return await pool.query(
      'INSERT INTO accounts (name, balance) VALUES ($1, $2) RETURNING *',
      ['Nova Conta', 1000]
    );
  }
);
```

### Testes de Consistência

#### Teste Específico
```typescript
// Executar teste de integridade referencial
const result = await consistencyService.runSpecificCheck('referential_integrity');

if (result.status === 'FAILED') {
  console.log(`Encontradas ${result.violationsFound} violações`);
  result.details.violations.forEach(violation => {
    console.log(`- ${violation.description}`);
  });
}
```

#### Relatório Completo
```typescript
// Executar todos os testes de consistência
const report = await consistencyService.runConsistencyChecks();

console.log(`Status geral: ${report.overall_status}`);
console.log(`Score de saúde: ${report.summary.health_score}/100`);
console.log(`Testes executados: ${report.tests_executed}`);
console.log(`Violações encontradas: ${report.violations_found}`);
```

### Eventos de Segurança

```typescript
// Registrar evento de segurança
await auditService.logSecurityEvent({
  event_type: 'UNAUTHORIZED_ACCESS',
  threat_level: 'HIGH',
  source_ip: '192.168.1.100',
  blocked: true,
  details: {
    attempted_operation: 'SELECT * FROM accounts',
    reason: 'IP não está na whitelist'
  }
});
```

### Relatórios e Dashboard

```typescript
// Obter dados do dashboard
const dashboardData = await reportService.getDashboardData();

console.log(`Score do sistema: ${dashboardData.system_health.overall_score}`);
console.log(`Operações/minuto: ${dashboardData.real_time_metrics.operations_per_minute}`);
console.log(`Alertas ativos: ${dashboardData.alerts.length}`);

// Gerar relatório detalhado
const report = await reportService.generateReport('config-id');
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```bash
# Banco de dados
DATABASE_URL=postgresql://user:password@host:port/database

# Auditoria
AUDIT_LOG_LEVEL=INFO
AUDIT_RETENTION_DAYS=90
AUDIT_BATCH_SIZE=100

# Consistência
CONSISTENCY_CHECK_INTERVAL_MINUTES=60
CONSISTENCY_PARALLEL_CHECKS=5

# Segurança
SECURITY_RATE_LIMIT_PER_MINUTE=100
SECURITY_IP_WHITELIST=127.0.0.1,192.168.1.0/24

# Relatórios
REPORTS_STORAGE_PATH=/var/audit-reports
REPORTS_EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Configuração Personalizada

```typescript
import { AuditSystemConfig } from './types/audit-system';

const config: AuditSystemConfig = {
  database: {
    connection_string: process.env.DATABASE_URL!,
    max_connections: 20,
    query_timeout_ms: 30000,
    retry_attempts: 3
  },
  audit: {
    enabled: true,
    log_level: 'INFO',
    retention_days: 90,
    batch_size: 100,
    flush_interval_ms: 5000
  },
  consistency: {
    enabled: true,
    check_interval_minutes: 60,
    parallel_checks: 5,
    snapshot_retention_days: 30
  },
  security: {
    enabled: true,
    rate_limit_requests_per_minute: 100,
    ip_whitelist: ['127.0.0.1', '192.168.1.0/24'],
    block_suspicious_queries: true,
    alert_threshold_violations_per_hour: 10
  },
  reporting: {
    enabled: true,
    default_format: 'JSON',
    storage_path: '/var/audit-reports',
    email_notifications: true
  }
};
```

## 🧪 Testes

### Executar Testes Unitários

```bash
# Todos os testes
npm test src/tests/audit-system.test.ts

# Testes específicos
npm test -- --testNamePattern="DatabaseAuditService"
```

### Executar Testes de Integração

```bash
# Configurar banco de teste
export TEST_DB_NAME=suagrana_test
export TEST_DB_HOST=localhost
export TEST_DB_PORT=5432

# Executar testes de integração
npm test src/tests/integration/audit-system-integration.test.ts
```

### Cobertura de Testes

```bash
npm test -- --coverage
```

## 📊 Monitoramento e Alertas

### Métricas Principais

- **System Health Score**: 0-100 (baseado em consistência, performance e segurança)
- **Operations per Minute**: Número de operações auditadas
- **Error Rate**: Percentual de operações falhadas
- **Consistency Score**: Percentual de testes de consistência aprovados
- **Security Score**: Baseado em eventos de segurança e violações

### Alertas Automáticos

O sistema gera alertas automáticos para:

- 🚨 **Crítico**: Violações de segurança, bypass detectado
- ⚠️ **Alto**: Inconsistências de dados, falhas de integridade
- 📢 **Médio**: Performance degradada, rate limiting
- 💡 **Baixo**: Manutenção necessária, limpeza de logs

### Dashboard em Tempo Real

```typescript
// Exemplo de uso do dashboard
const dashboardData = await reportService.getDashboardData();

// Verificar saúde do sistema
if (dashboardData.system_health.overall_score < 80) {
  console.warn('Sistema com problemas de saúde!');
}

// Verificar alertas críticos
const criticalAlerts = dashboardData.alerts.filter(
  alert => alert.severity === 'CRITICAL'
);

if (criticalAlerts.length > 0) {
  console.error(`${criticalAlerts.length} alertas críticos!`);
}
```

## 🔍 Tipos de Testes de Consistência

### 1. Integridade Referencial
- Verifica se todas as chaves estrangeiras são válidas
- Detecta registros órfãos
- Valida relacionamentos entre tabelas

### 2. Validação de Saldos
- Compara saldos das contas com soma das transações
- Detecta inconsistências financeiras
- Valida regras de negócio

### 3. Detecção de Duplicatas
- Identifica registros duplicados
- Verifica unicidade de dados críticos
- Detecta possíveis erros de importação

### 4. Completude de Dados
- Verifica campos obrigatórios
- Detecta dados incompletos
- Valida formatos e tipos

### 5. Regras de Negócio
- Valida regras específicas do domínio financeiro
- Verifica limites e restrições
- Detecta violações de políticas

### 6. Consistência Temporal
- Verifica ordem cronológica de eventos
- Detecta timestamps inconsistentes
- Valida sequências de operações

## 🛡️ Recursos de Segurança

### Detecção de Bypass

O sistema detecta tentativas de:
- Conexão direta ao banco de dados
- Operações fora do serviço central
- Queries suspeitas ou maliciosas
- Acesso de IPs não autorizados

### Rate Limiting

- Limite de operações por minuto/usuário
- Bloqueio automático de IPs suspeitos
- Throttling de operações em massa

### Auditoria de Segurança

- Log de todas as tentativas de acesso
- Rastreamento de sessões e usuários
- Análise de padrões suspeitos

## 📈 Relatórios Disponíveis

### 1. Relatório Executivo
- Resumo geral do sistema
- Métricas principais
- Tendências e recomendações

### 2. Trilha de Auditoria
- Histórico completo de operações
- Detalhes de cada transação
- Filtros por usuário, data, operação

### 3. Análise de Consistência
- Status de todos os testes
- Violações encontradas
- Recomendações de correção

### 4. Análise de Segurança
- Eventos de segurança
- Tentativas de bypass
- Análise de ameaças

### 5. Métricas de Performance
- Tempos de resposta
- Throughput de operações
- Uso de recursos

## 🔧 Manutenção e Troubleshooting

### Limpeza de Logs

```typescript
// Limpar logs antigos (mais de 90 dias)
const deletedCount = await auditService.cleanup(90);
console.log(`${deletedCount} logs antigos removidos`);
```

### Verificação de Saúde

```typescript
// Verificar saúde do sistema
const healthCheck = async () => {
  try {
    const dashboardData = await reportService.getDashboardData();
    const consistencyReport = await consistencyService.runConsistencyChecks();
    
    return {
      database_status: dashboardData.system_health.database_status,
      overall_score: dashboardData.system_health.overall_score,
      consistency_status: consistencyReport.overall_status,
      last_check: new Date()
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      last_check: new Date()
    };
  }
};
```

### Problemas Comuns

#### 1. Performance Lenta
```bash
# Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('audit_logs', 'security_events');

# Analisar queries lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 2. Espaço em Disco
```sql
-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE '%audit%' OR tablename LIKE '%security%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### 3. Conexões Esgotadas
```typescript
// Monitorar pool de conexões
const poolStatus = {
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
};

if (poolStatus.waiting > 0) {
  console.warn('Pool de conexões saturado!');
}
```

## 📚 Referências e Recursos

### Documentação Técnica
- [Tipos TypeScript](./src/types/audit-system.ts)
- [Testes Unitários](./src/tests/audit-system.test.ts)
- [Testes de Integração](./src/tests/integration/audit-system-integration.test.ts)

### Arquivos Principais
- `src/services/database-audit-service.ts` - Serviço principal de auditoria
- `src/services/data-consistency-service.ts` - Testes de consistência
- `src/services/audit-report-service.ts` - Geração de relatórios
- `src/middleware/database-security-middleware.ts` - Middleware de segurança

### Configuração de Banco
- Tabelas: `audit_logs`, `security_events`, `consistency_checks`, `audit_reports`
- Triggers: Auditoria automática em todas as tabelas principais
- Índices: Otimizados para consultas de auditoria e relatórios

## 🤝 Contribuição

Para contribuir com o sistema:

1. Seguir os padrões de código TypeScript
2. Adicionar testes para novas funcionalidades
3. Documentar mudanças na API
4. Testar em ambiente de desenvolvimento
5. Validar impacto na performance

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs de auditoria para diagnóstico
- Executar testes de consistência
- Consultar dashboard de saúde do sistema
- Revisar alertas de segurança

---

**⚠️ IMPORTANTE**: Este sistema é crítico para a integridade dos dados financeiros. Qualquer modificação deve ser cuidadosamente testada e validada antes da implementação em produção.
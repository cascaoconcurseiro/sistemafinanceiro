# 🚀 Guia de Início Rápido - Sistema de Auditoria SuaGrana

## ⚡ Setup em 5 Minutos

### 1. Importar e Inicializar

```typescript
import { Pool } from 'pg';
import { DatabaseAuditService } from '../services/database-audit-service';
import { DataConsistencyService } from '../services/data-consistency-service';
import { AuditReportService } from '../services/audit-report-service';

// Setup básico
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const auditService = new DatabaseAuditService(pool);

// Inicializar (apenas uma vez)
await auditService.initialize();
```

### 2. Auditar uma Operação

```typescript
import { AuditContext } from '../types/audit-system';

const context: AuditContext = {
  userId: 'user-123',
  sessionId: 'session-456',
  ipAddress: req.ip,
  operation: 'CREATE',
  tableName: 'transactions',
  recordId: 'txn-789'
};

// Método 1: Executar e auditar automaticamente
const result = await auditService.executeAndAudit(context, async () => {
  return await pool.query(
    'INSERT INTO transactions (amount, description) VALUES ($1, $2) RETURNING *',
    [100, 'Depósito']
  );
});

// Método 2: Auditar manualmente
await auditService.logOperation(context, null, { amount: 100, description: 'Depósito' });
```

### 3. Verificar Consistência

```typescript
const consistencyService = new DataConsistencyService(pool);
await consistencyService.initialize();

// Teste rápido
const result = await consistencyService.runSpecificCheck('referential_integrity');
console.log(`Status: ${result.status}, Violações: ${result.violationsFound}`);

// Relatório completo
const report = await consistencyService.runConsistencyChecks();
console.log(`Score de saúde: ${report.summary.health_score}/100`);
```

### 4. Dashboard em Tempo Real

```typescript
const reportService = new AuditReportService(pool);
await reportService.initialize();

const dashboard = await reportService.getDashboardData();
console.log(`Sistema: ${dashboard.system_health.overall_score}/100`);
console.log(`Operações/min: ${dashboard.real_time_metrics.operations_per_minute}`);
```

## 🔧 Integração com Express

```typescript
import express from 'express';
import { databaseSecurityMiddleware } from '../middleware/database-security-middleware';

const app = express();

// Aplicar middleware de segurança
app.use(databaseSecurityMiddleware);

// Exemplo de rota protegida
app.post('/api/transactions', async (req, res) => {
  const context: AuditContext = {
    userId: req.user.id,
    sessionId: req.sessionID,
    ipAddress: req.ip,
    operation: 'CREATE',
    tableName: 'transactions',
    recordId: crypto.randomUUID()
  };

  try {
    const result = await auditService.executeAndAudit(context, async () => {
      return await pool.query(
        'INSERT INTO transactions (user_id, amount, description) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, req.body.amount, req.body.description]
      );
    });

    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    await auditService.logSecurityEvent({
      event_type: 'OPERATION_FAILED',
      threat_level: 'MEDIUM',
      source_ip: req.ip,
      blocked: false,
      details: { error: error.message, operation: 'CREATE_TRANSACTION' }
    });

    res.status(500).json({ error: 'Operação falhou' });
  }
});
```

## 📊 Monitoramento Essencial

### Health Check Endpoint

```typescript
app.get('/api/health/audit', async (req, res) => {
  try {
    const dashboard = await reportService.getDashboardData();
    const consistency = await consistencyService.runConsistencyChecks();

    const health = {
      status: dashboard.system_health.overall_score > 80 ? 'healthy' : 'degraded',
      score: dashboard.system_health.overall_score,
      consistency_score: consistency.summary.health_score,
      last_check: new Date(),
      alerts: dashboard.alerts.filter(a => a.severity === 'CRITICAL').length
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

### Alertas Críticos

```typescript
// Verificar alertas a cada 5 minutos
setInterval(async () => {
  const dashboard = await reportService.getDashboardData();
  const criticalAlerts = dashboard.alerts.filter(a => a.severity === 'CRITICAL');

  if (criticalAlerts.length > 0) {
    console.error(`🚨 ${criticalAlerts.length} alertas críticos detectados!`);
    // Enviar notificação, email, etc.
  }
}, 5 * 60 * 1000);
```

## 🧪 Testes Rápidos

### Teste de Funcionalidade

```typescript
// test/audit-quick-test.ts
import { DatabaseAuditService } from '../src/services/database-audit-service';

describe('Audit System Quick Test', () => {
  test('should audit operation', async () => {
    const auditService = new DatabaseAuditService(pool);
    
    const context = {
      userId: 'test-user',
      sessionId: 'test-session',
      ipAddress: '127.0.0.1',
      operation: 'CREATE' as const,
      tableName: 'test_table',
      recordId: 'test-record'
    };

    await expect(
      auditService.logOperation(context, null, { test: 'data' })
    ).resolves.not.toThrow();
  });
});
```

## 🔒 Configuração de Segurança

### Variáveis de Ambiente Mínimas

```bash
# .env
DATABASE_URL=postgresql://user:pass@host:port/db
AUDIT_LOG_LEVEL=INFO
SECURITY_RATE_LIMIT_PER_MINUTE=100
SECURITY_IP_WHITELIST=127.0.0.1,192.168.1.0/24
```

### Middleware de Segurança

```typescript
import { Request, Response, NextFunction } from 'express';

// Aplicar em todas as rotas que acessam dados
app.use('/api/data/*', (req: Request, res: Response, next: NextFunction) => {
  // O middleware já está configurado para detectar bypass
  next();
});
```

## 📈 Métricas Importantes

### KPIs para Monitorar

```typescript
const getKPIs = async () => {
  const dashboard = await reportService.getDashboardData();
  
  return {
    // Saúde geral (meta: > 95)
    system_health: dashboard.system_health.overall_score,
    
    // Performance (meta: < 100ms)
    avg_response_time: dashboard.real_time_metrics.average_response_time_ms,
    
    // Segurança (meta: 0 críticos)
    critical_alerts: dashboard.alerts.filter(a => a.severity === 'CRITICAL').length,
    
    // Consistência (meta: > 98)
    consistency_score: dashboard.system_health.consistency_score,
    
    // Throughput (informativo)
    operations_per_minute: dashboard.real_time_metrics.operations_per_minute
  };
};
```

## 🚨 Troubleshooting Rápido

### Problema: Sistema Lento

```typescript
// Verificar performance
const metrics = await reportService.getDashboardData();
if (metrics.real_time_metrics.average_response_time_ms > 1000) {
  console.warn('Sistema lento detectado!');
  
  // Verificar pool de conexões
  console.log(`Conexões: ${pool.totalCount}/${pool.options.max}`);
  
  // Limpar logs antigos
  await auditService.cleanup(30); // manter apenas 30 dias
}
```

### Problema: Muitos Alertas

```typescript
// Analisar alertas
const dashboard = await reportService.getDashboardData();
const alertsByType = dashboard.alerts.reduce((acc, alert) => {
  acc[alert.type] = (acc[alert.type] || 0) + 1;
  return acc;
}, {});

console.log('Alertas por tipo:', alertsByType);
```

### Problema: Inconsistências

```typescript
// Executar diagnóstico completo
const report = await consistencyService.runConsistencyChecks();

if (report.overall_status === 'FAILED') {
  console.error('Inconsistências detectadas:');
  report.checks.forEach(check => {
    if (check.status === 'FAILED') {
      console.error(`- ${check.check_name}: ${check.violations_found} violações`);
    }
  });
}
```

## 📋 Checklist de Implementação

- [ ] ✅ Configurar variáveis de ambiente
- [ ] ✅ Inicializar serviços de auditoria
- [ ] ✅ Aplicar middleware de segurança
- [ ] ✅ Implementar contexto de auditoria em rotas
- [ ] ✅ Configurar health check endpoint
- [ ] ✅ Implementar alertas críticos
- [ ] ✅ Configurar testes automatizados
- [ ] ✅ Documentar operações críticas
- [ ] ✅ Configurar monitoramento de métricas
- [ ] ✅ Testar cenários de falha

## 🎯 Próximos Passos

1. **Implementar**: Seguir este guia para setup básico
2. **Testar**: Executar operações e verificar logs
3. **Monitorar**: Configurar dashboard e alertas
4. **Otimizar**: Ajustar configurações baseado em métricas
5. **Expandir**: Adicionar novos tipos de auditoria conforme necessário

---

**💡 Dica**: Comece com uma implementação simples e vá adicionando funcionalidades conforme a necessidade. O sistema foi projetado para ser modular e escalável.
/**
 * AUDITORIA PROFISSIONAL NÍVEL PRODUÇÃO
 * 
 * Verifica:
 * 1. Segurança e Autenticação
 * 2. Performance e Otimização
 * 3. Tratamento de Erros
 * 4. Logs e Monitoramento
 * 5. Testes e Cobertura
 * 6. Documentação
 * 7. Escalabilidade
 * 8. Backup e Recuperação
 * 9. Conformidade e Auditoria
 * 10. UX e Acessibilidade
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: [],
};

function addIssue(severity, category, title, description, solution) {
  issues[severity].push({
    category,
    title,
    description,
    solution,
  });
}

async function main() {
  console.log('🔍 AUDITORIA PROFISSIONAL NÍVEL PRODUÇÃO\n');
  console.log('='.repeat(70));

  // ============================================
  // 1. SEGURANÇA E AUTENTICAÇÃO
  // ============================================
  console.log('\n🔒 1. SEGURANÇA E AUTENTICAÇÃO');
  
  // Verificar se há senhas em texto plano
  const usersWithPlainPassword = await prisma.user.findMany({
    where: {
      password: {
        not: {
          startsWith: '$2',
        },
      },
    },
  });

  if (usersWithPlainPassword.length > 0) {
    addIssue(
      'critical',
      'Segurança',
      'Senhas em texto plano',
      `${usersWithPlainPassword.length} usuários com senhas não criptografadas`,
      'Implementar bcrypt para hash de senhas'
    );
    console.log('   ❌ CRÍTICO: Senhas em texto plano detectadas');
  } else {
    console.log('   ✅ Senhas criptografadas');
  }

  // Verificar rate limiting
  const hasRateLimiting = fs.existsSync('src/middleware/rate-limit.ts');
  if (!hasRateLimiting) {
    addIssue(
      'high',
      'Segurança',
      'Rate Limiting ausente',
      'API não tem proteção contra ataques de força bruta',
      'Implementar rate limiting com express-rate-limit ou similar'
    );
    console.log('   ⚠️ ALTO: Rate limiting não implementado');
  } else {
    console.log('   ✅ Rate limiting implementado');
  }

  // Verificar CORS
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  if (!nextConfig.includes('cors') && !nextConfig.includes('headers')) {
    addIssue(
      'medium',
      'Segurança',
      'CORS não configurado',
      'Configuração de CORS pode estar ausente',
      'Configurar CORS adequadamente no next.config.js'
    );
    console.log('   ⚠️ MÉDIO: CORS pode não estar configurado');
  } else {
    console.log('   ✅ CORS configurado');
  }

  // ============================================
  // 2. PERFORMANCE E OTIMIZAÇÃO
  // ============================================
  console.log('\n⚡ 2. PERFORMANCE E OTIMIZAÇÃO');

  // Verificar índices no banco
  const transactionCount = await prisma.transaction.count();
  if (transactionCount > 1000) {
    addIssue(
      'medium',
      'Performance',
      'Volume alto de transações',
      `${transactionCount} transações - considerar paginação e cache`,
      'Implementar paginação em todas as listagens e cache Redis'
    );
    console.log(`   ⚠️ MÉDIO: ${transactionCount} transações (considerar cache)`);
  } else {
    console.log(`   ✅ Volume de transações OK (${transactionCount})`);
  }

  // Verificar queries N+1
  const hasIncludeOptimization = fs.existsSync('src/lib/services/query-optimizer.ts');
  if (!hasIncludeOptimization) {
    addIssue(
      'low',
      'Performance',
      'Otimização de queries',
      'Não há serviço centralizado de otimização de queries',
      'Criar QueryOptimizer para evitar N+1 queries'
    );
    console.log('   ℹ️ INFO: Considerar QueryOptimizer centralizado');
  }

  // Verificar cache
  const hasCache = fs.existsSync('src/lib/cache') || nextConfig.includes('redis');
  if (!hasCache) {
    addIssue(
      'medium',
      'Performance',
      'Cache não implementado',
      'Sistema não usa cache para dados frequentes',
      'Implementar Redis ou cache em memória'
    );
    console.log('   ⚠️ MÉDIO: Cache não implementado');
  } else {
    console.log('   ✅ Cache implementado');
  }

  // ============================================
  // 3. TRATAMENTO DE ERROS
  // ============================================
  console.log('\n🚨 3. TRATAMENTO DE ERROS');

  // Verificar error boundary
  const hasErrorBoundary = fs.existsSync('src/components/error-boundary.tsx');
  if (!hasErrorBoundary) {
    addIssue(
      'high',
      'Confiabilidade',
      'Error Boundary ausente',
      'Aplicação pode crashar completamente em caso de erro',
      'Implementar Error Boundary no React'
    );
    console.log('   ⚠️ ALTO: Error Boundary não implementado');
  } else {
    console.log('   ✅ Error Boundary implementado');
  }

  // Verificar error tracking
  const hasSentry = fs.existsSync('sentry.config.js') || 
                    fs.readFileSync('package.json', 'utf8').includes('sentry');
  if (!hasSentry) {
    addIssue(
      'high',
      'Monitoramento',
      'Error tracking ausente',
      'Erros em produção não são rastreados',
      'Implementar Sentry ou similar para tracking de erros'
    );
    console.log('   ⚠️ ALTO: Error tracking não implementado');
  } else {
    console.log('   ✅ Error tracking implementado');
  }

  // ============================================
  // 4. LOGS E MONITORAMENTO
  // ============================================
  console.log('\n📊 4. LOGS E MONITORAMENTO');

  // Verificar sistema de logs
  const hasLogger = fs.existsSync('src/lib/logger.ts');
  if (!hasLogger) {
    addIssue(
      'medium',
      'Monitoramento',
      'Sistema de logs ausente',
      'Logs não são estruturados ou centralizados',
      'Implementar Winston ou Pino para logs estruturados'
    );
    console.log('   ⚠️ MÉDIO: Sistema de logs não estruturado');
  } else {
    console.log('   ✅ Sistema de logs implementado');
  }

  // Verificar health check
  const hasHealthCheck = fs.existsSync('src/app/api/health/route.ts');
  if (!hasHealthCheck) {
    addIssue(
      'medium',
      'Monitoramento',
      'Health check ausente',
      'Não há endpoint para verificar saúde da aplicação',
      'Criar endpoint /api/health'
    );
    console.log('   ⚠️ MÉDIO: Health check não implementado');
  } else {
    console.log('   ✅ Health check implementado');
  }

  // Verificar métricas
  const hasMetrics = fs.existsSync('src/lib/metrics.ts') ||
                     fs.existsSync('src/app/api/metrics/route.ts');
  if (!hasMetrics) {
    addIssue(
      'low',
      'Monitoramento',
      'Métricas ausentes',
      'Não há coleta de métricas de negócio',
      'Implementar coleta de métricas (Prometheus, DataDog)'
    );
    console.log('   ℹ️ INFO: Métricas de negócio não implementadas');
  }

  // ============================================
  // 5. TESTES E COBERTURA
  // ============================================
  console.log('\n🧪 5. TESTES E COBERTURA');

  // Verificar testes unitários
  const hasUnitTests = fs.existsSync('src/__tests__') || 
                       fs.existsSync('tests/unit');
  if (!hasUnitTests) {
    addIssue(
      'critical',
      'Qualidade',
      'Testes unitários ausentes',
      'Sistema não tem testes unitários',
      'Implementar Jest + React Testing Library'
    );
    console.log('   ❌ CRÍTICO: Testes unitários não implementados');
  } else {
    console.log('   ✅ Testes unitários implementados');
  }

  // Verificar testes de integração
  const hasIntegrationTests = fs.existsSync('tests/integration') ||
                               fs.existsSync('src/__tests__/integration');
  if (!hasIntegrationTests) {
    addIssue(
      'high',
      'Qualidade',
      'Testes de integração ausentes',
      'APIs não têm testes de integração',
      'Implementar testes de integração com Supertest'
    );
    console.log('   ⚠️ ALTO: Testes de integração não implementados');
  } else {
    console.log('   ✅ Testes de integração implementados');
  }

  // Verificar E2E tests
  const hasE2ETests = fs.existsSync('e2e') || 
                      fs.readFileSync('package.json', 'utf8').includes('playwright');
  if (!hasE2ETests) {
    addIssue(
      'medium',
      'Qualidade',
      'Testes E2E ausentes',
      'Fluxos críticos não têm testes end-to-end',
      'Implementar Playwright ou Cypress'
    );
    console.log('   ⚠️ MÉDIO: Testes E2E não implementados');
  } else {
    console.log('   ✅ Testes E2E implementados');
  }

  // ============================================
  // 6. DOCUMENTAÇÃO
  // ============================================
  console.log('\n📚 6. DOCUMENTAÇÃO');

  // Verificar README
  const hasReadme = fs.existsSync('README.md');
  if (!hasReadme) {
    addIssue(
      'medium',
      'Documentação',
      'README ausente',
      'Projeto não tem README principal',
      'Criar README.md com instruções de setup'
    );
    console.log('   ⚠️ MÉDIO: README não encontrado');
  } else {
    console.log('   ✅ README presente');
  }

  // Verificar documentação da API
  const hasAPIDoc = fs.existsSync('docs/API.md') || 
                    fs.existsSync('swagger.json') ||
                    fs.existsSync('src/app/api/docs/route.ts');
  if (!hasAPIDoc) {
    addIssue(
      'medium',
      'Documentação',
      'Documentação da API ausente',
      'APIs não têm documentação formal',
      'Implementar Swagger/OpenAPI'
    );
    console.log('   ⚠️ MÉDIO: Documentação da API ausente');
  } else {
    console.log('   ✅ Documentação da API presente');
  }

  // ============================================
  // 7. ESCALABILIDADE
  // ============================================
  console.log('\n📈 7. ESCALABILIDADE');

  // Verificar connection pooling
  const envContent = fs.readFileSync('.env', 'utf8');
  if (!envContent.includes('connection_limit')) {
    addIssue(
      'medium',
      'Escalabilidade',
      'Connection pooling não configurado',
      'Prisma não tem limite de conexões configurado',
      'Configurar connection_limit no DATABASE_URL'
    );
    console.log('   ⚠️ MÉDIO: Connection pooling não configurado');
  } else {
    console.log('   ✅ Connection pooling configurado');
  }

  // Verificar queue system
  const hasQueue = fs.existsSync('src/lib/queue.ts') || 
                   fs.existsSync('src/lib/queue') || 
                   fs.readFileSync('package.json', 'utf8').includes('bull');
  if (!hasQueue) {
    addIssue(
      'low',
      'Escalabilidade',
      'Sistema de filas ausente',
      'Operações pesadas não usam filas',
      'Implementar Bull ou BullMQ para processamento assíncrono'
    );
    console.log('   ℹ️ INFO: Sistema de filas não implementado');
  }

  // ============================================
  // 8. BACKUP E RECUPERAÇÃO
  // ============================================
  console.log('\n💾 8. BACKUP E RECUPERAÇÃO');

  // Verificar backup automático
  const hasBackupScript = fs.existsSync('scripts/backup.js') || 
                          fs.existsSync('scripts/backup.sh') ||
                          fs.existsSync('scripts/backup-database.js');
  if (!hasBackupScript) {
    addIssue(
      'critical',
      'Backup',
      'Backup automático ausente',
      'Não há script de backup do banco de dados',
      'Criar script de backup automático com cron'
    );
    console.log('   ❌ CRÍTICO: Backup automático não implementado');
  } else {
    console.log('   ✅ Backup automático implementado');
  }

  // Verificar disaster recovery plan
  const hasDRPlan = fs.existsSync('docs/DISASTER-RECOVERY.md');
  if (!hasDRPlan) {
    addIssue(
      'high',
      'Backup',
      'Plano de recuperação ausente',
      'Não há documentação de disaster recovery',
      'Criar documento com procedimentos de recuperação'
    );
    console.log('   ⚠️ ALTO: Plano de disaster recovery ausente');
  } else {
    console.log('   ✅ Plano de disaster recovery documentado');
  }

  // ============================================
  // 9. CONFORMIDADE E AUDITORIA
  // ============================================
  console.log('\n⚖️ 9. CONFORMIDADE E AUDITORIA');

  // Verificar LGPD/GDPR
  const hasPrivacyPolicy = fs.existsSync('docs/PRIVACY-POLICY.md');
  if (!hasPrivacyPolicy) {
    addIssue(
      'high',
      'Conformidade',
      'Política de privacidade ausente',
      'Não há política de privacidade (LGPD/GDPR)',
      'Criar política de privacidade e termos de uso'
    );
    console.log('   ⚠️ ALTO: Política de privacidade ausente');
  } else {
    console.log('   ✅ Política de privacidade presente');
  }

  // Verificar audit log
  const auditLogCount = await prisma.auditEvent.count();
  if (auditLogCount === 0) {
    addIssue(
      'medium',
      'Conformidade',
      'Audit log não utilizado',
      'Sistema de auditoria existe mas não está sendo usado',
      'Implementar logging de todas operações críticas'
    );
    console.log('   ⚠️ MÉDIO: Audit log não está sendo usado');
  } else {
    console.log(`   ✅ Audit log ativo (${auditLogCount} eventos)`);
  }

  // ============================================
  // 10. UX E ACESSIBILIDADE
  // ============================================
  console.log('\n♿ 10. UX E ACESSIBILIDADE');

  // Verificar loading states
  const hasLoadingStates = fs.existsSync('src/components/ui/loading.tsx') || 
                           fs.existsSync('src/components/ui/skeleton.tsx');
  if (!hasLoadingStates) {
    addIssue(
      'medium',
      'UX',
      'Loading states ausentes',
      'Componentes não têm estados de carregamento',
      'Implementar Skeleton loaders'
    );
    console.log('   ⚠️ MÉDIO: Loading states não implementados');
  } else {
    console.log('   ✅ Loading states implementados');
  }

  // Verificar acessibilidade
  const hasA11y = fs.readFileSync('package.json', 'utf8').includes('eslint-plugin-jsx-a11y');
  if (!hasA11y) {
    addIssue(
      'medium',
      'Acessibilidade',
      'Linting de acessibilidade ausente',
      'Não há verificação automática de acessibilidade',
      'Adicionar eslint-plugin-jsx-a11y'
    );
    console.log('   ⚠️ MÉDIO: Linting de acessibilidade ausente');
  } else {
    console.log('   ✅ Linting de acessibilidade configurado');
  }

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA AUDITORIA PROFISSIONAL');
  console.log('='.repeat(70));

  const totalIssues = 
    issues.critical.length +
    issues.high.length +
    issues.medium.length +
    issues.low.length;

  console.log(`\n🔍 Total de problemas encontrados: ${totalIssues}`);
  console.log('');
  console.log(`   ❌ CRÍTICO: ${issues.critical.length}`);
  console.log(`   ⚠️ ALTO: ${issues.high.length}`);
  console.log(`   ⚠️ MÉDIO: ${issues.medium.length}`);
  console.log(`   ℹ️ BAIXO: ${issues.low.length}`);
  console.log(`   ℹ️ INFO: ${issues.info.length}`);

  console.log('\n' + '='.repeat(70));

  // Calcular score
  const maxScore = 100;
  const criticalPenalty = issues.critical.length * 20;
  const highPenalty = issues.high.length * 10;
  const mediumPenalty = issues.medium.length * 5;
  const lowPenalty = issues.low.length * 2;

  const score = Math.max(0, maxScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty);

  console.log(`\n📊 SCORE DE PRODUÇÃO: ${score}/100`);

  if (score >= 90) {
    console.log('🎉 EXCELENTE! Sistema pronto para produção empresarial');
  } else if (score >= 70) {
    console.log('✅ BOM! Sistema pronto para produção com melhorias recomendadas');
  } else if (score >= 50) {
    console.log('⚠️ REGULAR! Sistema precisa de melhorias antes de produção');
  } else {
    console.log('❌ CRÍTICO! Sistema NÃO está pronto para produção');
  }

  // Salvar relatório detalhado
  const report = {
    date: new Date().toISOString(),
    score,
    totalIssues,
    issues,
    recommendations: generateRecommendations(issues),
  };

  fs.writeFileSync(
    'professional-audit-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Relatório detalhado salvo em: professional-audit-report.json');

  // Gerar plano de ação
  generateActionPlan(issues);
}

function generateRecommendations(issues) {
  const recommendations = [];

  if (issues.critical.length > 0) {
    recommendations.push({
      priority: 'URGENTE',
      action: 'Corrigir todos os problemas CRÍTICOS antes de ir para produção',
      items: issues.critical.map(i => i.title),
    });
  }

  if (issues.high.length > 0) {
    recommendations.push({
      priority: 'ALTA',
      action: 'Implementar soluções para problemas de ALTA prioridade',
      items: issues.high.map(i => i.title),
    });
  }

  return recommendations;
}

function generateActionPlan(issues) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 PLANO DE AÇÃO');
  console.log('='.repeat(70));

  if (issues.critical.length > 0) {
    console.log('\n❌ CRÍTICO - Corrigir IMEDIATAMENTE:');
    issues.critical.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.title}`);
      console.log(`   Problema: ${issue.description}`);
      console.log(`   Solução: ${issue.solution}`);
    });
  }

  if (issues.high.length > 0) {
    console.log('\n⚠️ ALTO - Corrigir antes de produção:');
    issues.high.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.title}`);
      console.log(`   Problema: ${issue.description}`);
      console.log(`   Solução: ${issue.solution}`);
    });
  }

  if (issues.medium.length > 0) {
    console.log('\n⚠️ MÉDIO - Melhorias recomendadas:');
    issues.medium.slice(0, 5).forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.title}`);
      console.log(`   Solução: ${issue.solution}`);
    });
    if (issues.medium.length > 5) {
      console.log(`\n   ... e mais ${issues.medium.length - 5} itens`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

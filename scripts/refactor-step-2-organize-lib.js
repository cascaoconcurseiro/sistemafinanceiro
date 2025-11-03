/**
 * Refatoração Passo 2 - Organizar src/lib
 * Move arquivos soltos para subpastas apropriadas
 */

const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '..', 'src', 'lib');

console.log('🔧 REFATORAÇÃO PASSO 2 - ORGANIZANDO SRC/LIB\n');

let moved = 0;

function moveFile(from, to) {
  try {
    const fromPath = path.join(libDir, from);
    const toPath = path.join(libDir, to);

    if (!fs.existsSync(fromPath)) {
      return false;
    }

    // Criar diretório se não existir
    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }

    // Mover arquivo
    fs.renameSync(fromPath, toPath);
    console.log(`✓ ${from} → ${to}`);
    moved++;
    return true;
  } catch (error) {
    console.log(`✗ Erro ao mover ${from}`);
    return false;
  }
}

console.log('📁 ORGANIZANDO ARQUIVOS DE AUTENTICAÇÃO\n');
moveFile('auth.ts', 'auth/auth.ts');
moveFile('auth-fetch.ts', 'auth/auth-fetch.ts');
moveFile('auth-helpers.ts', 'auth/auth-helpers.ts');
moveFile('auth-interceptor.ts', 'auth/auth-interceptor.ts');

console.log('\n📁 ORGANIZANDO ARQUIVOS DE CACHE\n');
moveFile('cache.ts', 'cache/cache.ts');
moveFile('cache-manager.ts', 'cache/cache-manager.ts');
moveFile('simple-cache.ts', 'cache/simple-cache.ts');

console.log('\n📁 ORGANIZANDO ARQUIVOS DE API\n');
moveFile('api-client.ts', 'api/api-client.ts');
moveFile('optimized-api-client.ts', 'api/optimized-api-client.ts');
moveFile('react-query.ts', 'api/react-query.ts');
moveFile('react-query-optimized.ts', 'api/react-query-optimized.ts');
moveFile('react-query-invalidation.ts', 'api/react-query-invalidation.ts');

console.log('\n📁 ORGANIZANDO ARQUIVOS DE LOGGING\n');
moveFile('logger.ts', 'logging/logger.ts');
moveFile('audit-logger.ts', 'logging/audit-logger.ts');
moveFile('security-logger.ts', 'logging/security-logger.ts');

console.log('\n📁 ORGANIZANDO ARQUIVOS DE ENGINES\n');
moveFile('double-entry-engine.ts', 'engines/double-entry-engine.ts');
moveFile('installment-engine.ts', 'engines/installment-engine.ts');
moveFile('transfer-engine.ts', 'engines/transfer-engine.ts');
moveFile('notification-engine.ts', 'engines/notification-engine.ts');

console.log('\n📁 ORGANIZANDO ARQUIVOS DE CONFIGURAÇÃO\n');
moveFile('config.ts', 'config/config.ts');
moveFile('storage.ts', 'config/storage.ts');

console.log('\n📁 ORGANIZANDO ARQUIVOS DE PERFORMANCE\n');
moveFile('performance-monitor.ts', 'performance/performance-monitor.ts');
moveFile('performance-optimizer.tsx', 'performance/performance-optimizer.tsx');

console.log('\n📁 ORGANIZANDO OUTROS ARQUIVOS\n');
moveFile('bank-logos.ts', 'data/bank-logos.ts');
moveFile('data-initialization.ts', 'initialization/data-initialization.ts');
moveFile('debug.ts', 'utils/debug.ts');
moveFile('error-handler.ts', 'utils/error-handler.ts');
moveFile('ensure-default-categories.ts', 'initialization/ensure-default-categories.ts');
moveFile('events.ts', 'events/events.ts');
moveFile('openapi.ts', 'api/openapi.ts');
moveFile('prisma-middleware.ts', 'database/prisma-middleware.ts');
moveFile('rate-limiter.ts', 'security/rate-limiter.ts');
moveFile('reconciliation-job.ts', 'jobs/reconciliation-job.ts');
moveFile('reports-calculator.ts', 'services/reports-calculator.ts');
moveFile('smart-suggestions.ts', 'services/smart-suggestions.ts');
moveFile('transaction-audit.ts', 'audit/transaction-audit.ts');
moveFile('translations.ts', 'i18n/translations.ts');

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Passo 2 concluído!`);
console.log(`📦 Arquivos organizados: ${moved}`);
console.log('\n📝 Estrutura de lib/ agora está organizada!\n');

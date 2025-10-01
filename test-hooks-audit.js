/**
 * 🔍 AUDITORIA DE HOOKS ESPECIALIZADOS
 * 
 * Este script audita os hooks especializados do sistema SuaGrana:
 * - use-financial-engine: Verifica integração com Financial Engine oficial
 * - use-reports: Verifica se usa apenas Financial Engine (sem cálculos locais)
 * - useDashboardData: Verifica consistência de dados
 * - Hooks otimizados: Verifica performance e consistência
 */

const fs = require('fs');
const path = require('path');

// Configuração
const BASE_URL = 'http://localhost:3000';
const HOOKS_DIR = path.join(__dirname, 'src', 'hooks');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para analisar código de hooks
function analyzeHookCode(hookPath) {
  try {
    const code = fs.readFileSync(hookPath, 'utf8');
    
    const analysis = {
      file: path.basename(hookPath),
      usesFinancialEngine: code.includes('useFinancialEngine') || code.includes('financialEngine'),
      hasLocalCalculations: false,
      hasDirectDatabaseAccess: code.includes('databaseService') || code.includes('DatabaseService'),
      usesApiRoutes: code.includes('/api/'),
      hasErrorHandling: code.includes('try') && code.includes('catch'),
      hasTypeScript: hookPath.endsWith('.ts'),
      issues: [],
      recommendations: []
    };
    
    // Verificar cálculos locais suspeitos
    const calculationPatterns = [
      /\.reduce\s*\(\s*\([^)]*\)\s*=>\s*[^}]*\+/g,
      /\.filter\s*\([^)]*type.*===.*['"]income['"].*\)/g,
      /\.filter\s*\([^)]*type.*===.*['"]expense['"].*\)/g,
      /totalIncome\s*=.*\.reduce/g,
      /totalExpenses\s*=.*\.reduce/g,
      /balance\s*=.*-/g
    ];
    
    calculationPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        analysis.hasLocalCalculations = true;
      }
    });
    
    // Verificar problemas específicos
    if (analysis.hasLocalCalculations && !analysis.usesFinancialEngine) {
      analysis.issues.push('Hook faz cálculos locais sem usar Financial Engine');
      analysis.recommendations.push('Migrar cálculos para Financial Engine oficial');
    }
    
    if (analysis.hasDirectDatabaseAccess) {
      analysis.issues.push('Hook acessa banco de dados diretamente');
      analysis.recommendations.push('Usar API routes ao invés de acesso direto ao banco');
    }
    
    if (!analysis.hasErrorHandling) {
      analysis.issues.push('Hook não possui tratamento de erros adequado');
      analysis.recommendations.push('Implementar try/catch para operações assíncronas');
    }
    
    return analysis;
  } catch (error) {
    return {
      file: path.basename(hookPath),
      error: `Erro ao analisar arquivo: ${error.message}`,
      issues: ['Arquivo não pôde ser analisado'],
      recommendations: ['Verificar se o arquivo existe e é válido']
    };
  }
}

// Função para testar APIs necessárias para hooks
async function testHookAPIs() {
  log('\n📡 Testando APIs necessárias para hooks...', 'blue');
  
  const apis = [
    { name: 'Transactions API', url: `${BASE_URL}/api/transactions` },
    { name: 'Accounts API', url: `${BASE_URL}/api/accounts` },
    { name: 'Categories API', url: `${BASE_URL}/api/categories` }
  ];
  
  const results = [];
  
  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      
      results.push({
        name: api.name,
        status: response.ok ? 'OK' : 'ERROR',
        statusCode: response.status,
        dataCount: Array.isArray(data) ? data.length : 'N/A',
        hasData: Array.isArray(data) && data.length > 0
      });
      
      log(`  ✅ ${api.name}: ${response.status} - ${Array.isArray(data) ? data.length : 'N/A'} registros`, 'green');
    } catch (error) {
      results.push({
        name: api.name,
        status: 'ERROR',
        error: error.message
      });
      log(`  ❌ ${api.name}: ${error.message}`, 'red');
    }
  }
  
  return results;
}

// Função para simular uso de hooks críticos
async function simulateHookUsage() {
  log('\n🧪 Simulando uso de hooks críticos...', 'blue');
  
  try {
    // Buscar dados das APIs
    const [transactionsRes, accountsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/transactions`),
      fetch(`${BASE_URL}/api/accounts`)
    ]);
    
    const transactions = await transactionsRes.json();
    const accounts = await accountsRes.json();
    
    log(`  📊 Dados carregados: ${transactions.length} transações, ${accounts.length} contas`, 'blue');
    
    // Simular cálculos que os hooks deveriam fazer
    const simulation = {
      // Simular use-financial-engine
      financialEngine: {
        totalBalance: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        accountsWithBalance: accounts.filter(acc => (acc.balance || 0) !== 0).length,
        transactionsByType: {
          income: transactions.filter(t => t.type === 'income').length,
          expense: transactions.filter(t => t.type === 'expense').length,
          transfer: transactions.filter(t => t.type === 'transfer').length
        }
      },
      
      // Simular use-reports
      reports: {
        totalIncome: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        totalExpenses: transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
        categoriesCount: new Set(transactions.map(t => t.category).filter(Boolean)).size
      },
      
      // Simular dashboard data
      dashboard: {
        activeAccounts: accounts.filter(acc => acc.status === 'active').length,
        recentTransactions: transactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10).length,
        monthlyTransactions: transactions.filter(t => {
          const transactionDate = new Date(t.date);
          const now = new Date();
          return transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear();
        }).length
      }
    };
    
    log('  ✅ Simulação de Financial Engine concluída', 'green');
    log(`    - Saldo total: R$ ${simulation.financialEngine.totalBalance.toFixed(2)}`, 'blue');
    log(`    - Contas com saldo: ${simulation.financialEngine.accountsWithBalance}`, 'blue');
    
    log('  ✅ Simulação de Reports concluída', 'green');
    log(`    - Receitas: R$ ${simulation.reports.totalIncome.toFixed(2)}`, 'blue');
    log(`    - Despesas: R$ ${simulation.reports.totalExpenses.toFixed(2)}`, 'blue');
    log(`    - Categorias: ${simulation.reports.categoriesCount}`, 'blue');
    
    log('  ✅ Simulação de Dashboard concluída', 'green');
    log(`    - Contas ativas: ${simulation.dashboard.activeAccounts}`, 'blue');
    log(`    - Transações recentes: ${simulation.dashboard.recentTransactions}`, 'blue');
    log(`    - Transações do mês: ${simulation.dashboard.monthlyTransactions}`, 'blue');
    
    return simulation;
  } catch (error) {
    log(`  ❌ Erro na simulação: ${error.message}`, 'red');
    return null;
  }
}

// Função principal de auditoria
async function auditHooks() {
  log('🔍 INICIANDO AUDITORIA DE HOOKS ESPECIALIZADOS', 'bold');
  log('=' .repeat(60), 'blue');
  
  // 1. Analisar código dos hooks
  log('\n📁 Analisando código dos hooks...', 'blue');
  
  const hookFiles = [
    'use-financial-engine.ts',
    'use-reports.ts',
    'useDashboardData.ts',
    'useMockDashboard.ts',
    'use-optimized-accounts.ts',
    'use-optimized-transactions.ts',
    'use-unified.ts',
    'unified.ts'
  ];
  
  const analyses = [];
  
  for (const hookFile of hookFiles) {
    const hookPath = path.join(HOOKS_DIR, hookFile);
    if (fs.existsSync(hookPath)) {
      const analysis = analyzeHookCode(hookPath);
      analyses.push(analysis);
      
      log(`\n  📄 ${hookFile}:`, 'yellow');
      log(`    - Usa Financial Engine: ${analysis.usesFinancialEngine ? '✅' : '❌'}`, 
          analysis.usesFinancialEngine ? 'green' : 'red');
      log(`    - Tem cálculos locais: ${analysis.hasLocalCalculations ? '⚠️' : '✅'}`, 
          analysis.hasLocalCalculations ? 'yellow' : 'green');
      log(`    - Acesso direto ao DB: ${analysis.hasDirectDatabaseAccess ? '❌' : '✅'}`, 
          analysis.hasDirectDatabaseAccess ? 'red' : 'green');
      log(`    - Usa API routes: ${analysis.usesApiRoutes ? '✅' : '⚠️'}`, 
          analysis.usesApiRoutes ? 'green' : 'yellow');
      log(`    - Tratamento de erros: ${analysis.hasErrorHandling ? '✅' : '❌'}`, 
          analysis.hasErrorHandling ? 'green' : 'red');
      
      if (analysis.issues.length > 0) {
        log(`    - Problemas encontrados: ${analysis.issues.length}`, 'red');
        analysis.issues.forEach(issue => log(`      • ${issue}`, 'red'));
      }
    } else {
      log(`  ⚠️ Hook não encontrado: ${hookFile}`, 'yellow');
    }
  }
  
  // 2. Testar APIs
  const apiResults = await testHookAPIs();
  
  // 3. Simular uso dos hooks
  const simulation = await simulateHookUsage();
  
  // 4. Gerar relatório final
  log('\n📊 RELATÓRIO FINAL DA AUDITORIA DE HOOKS', 'bold');
  log('=' .repeat(60), 'blue');
  
  const totalHooks = analyses.length;
  const hooksWithIssues = analyses.filter(a => a.issues && a.issues.length > 0).length;
  const hooksUsingFinancialEngine = analyses.filter(a => a.usesFinancialEngine).length;
  const hooksWithLocalCalculations = analyses.filter(a => a.hasLocalCalculations).length;
  
  log(`\n📈 Estatísticas Gerais:`, 'blue');
  log(`  - Total de hooks analisados: ${totalHooks}`, 'blue');
  log(`  - Hooks com problemas: ${hooksWithIssues}`, hooksWithIssues > 0 ? 'red' : 'green');
  log(`  - Hooks usando Financial Engine: ${hooksUsingFinancialEngine}/${totalHooks}`, 
      hooksUsingFinancialEngine === totalHooks ? 'green' : 'yellow');
  log(`  - Hooks com cálculos locais: ${hooksWithLocalCalculations}`, 
      hooksWithLocalCalculations > 0 ? 'yellow' : 'green');
  
  log(`\n🔧 Recomendações Prioritárias:`, 'yellow');
  
  if (hooksWithLocalCalculations > 0) {
    log(`  1. Migrar ${hooksWithLocalCalculations} hooks para usar Financial Engine oficial`, 'yellow');
  }
  
  if (hooksWithIssues > 0) {
    log(`  2. Corrigir problemas identificados em ${hooksWithIssues} hooks`, 'yellow');
  }
  
  const failedAPIs = apiResults.filter(api => api.status === 'ERROR').length;
  if (failedAPIs > 0) {
    log(`  3. Corrigir ${failedAPIs} APIs com falhas`, 'red');
  }
  
  log(`\n✅ Hooks em conformidade:`, 'green');
  analyses.forEach(analysis => {
    if (!analysis.issues || analysis.issues.length === 0) {
      log(`  - ${analysis.file}`, 'green');
    }
  });
  
  if (hooksWithIssues > 0) {
    log(`\n❌ Hooks com problemas:`, 'red');
    analyses.forEach(analysis => {
      if (analysis.issues && analysis.issues.length > 0) {
        log(`  - ${analysis.file}: ${analysis.issues.length} problema(s)`, 'red');
      }
    });
  }
  
  log('\n🎯 Status da Auditoria:', 'bold');
  if (hooksWithIssues === 0 && failedAPIs === 0) {
    log('  ✅ TODOS OS HOOKS ESTÃO EM CONFORMIDADE!', 'green');
  } else {
    log(`  ⚠️ ENCONTRADOS PROBLEMAS EM ${hooksWithIssues} HOOKS E ${failedAPIs} APIS`, 'yellow');
  }
  
  return {
    totalHooks,
    hooksWithIssues,
    hooksUsingFinancialEngine,
    hooksWithLocalCalculations,
    apiResults,
    simulation,
    analyses
  };
}

// Executar auditoria
if (require.main === module) {
  auditHooks().catch(console.error);
}

module.exports = { auditHooks };
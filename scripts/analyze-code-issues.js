#!/usr/bin/env node

/**
 * Script para analisar problemas de lógica e código
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analisando Código para Problemas de Lógica...\n');

const issues = [];
const warnings = [];
const info = [];

// ============================================
// ANÁLISE 1: Queue.ts - While(true) Loop
// ============================================
console.log('📋 Análise 1: Sistema de Filas (queue.ts)');
try {
  const queuePath = path.join(__dirname, '../src/lib/queue.ts');
  const queueContent = fs.readFileSync(queuePath, 'utf8');

  // Verificar while(true)
  if (queueContent.includes('while (true)')) {
    const hasBreak = queueContent.match(/while\s*\(true\)[^}]*break/s);
    
    if (hasBreak) {
      warnings.push({
        file: 'src/lib/queue.ts',
        issue: 'Loop while(true) com break',
        severity: 'warning',
        description: 'Loop infinito controlado, mas pode causar problemas se a condição de break falhar',
        line: queueContent.split('\n').findIndex(l => l.includes('while (true)')) + 1,
        suggestion: 'Considerar usar while(condition) ao invés de while(true) com break'
      });
      console.log('⚠️  Loop while(true) encontrado (com break)');
    } else {
      issues.push({
        file: 'src/lib/queue.ts',
        issue: 'Loop while(true) sem break',
        severity: 'error',
        description: 'Loop infinito sem condição de saída clara',
        line: queueContent.split('\n').findIndex(l => l.includes('while (true)')) + 1,
        suggestion: 'URGENTE: Adicionar condição de break ou usar while(condition)'
      });
      console.log('❌ Loop while(true) SEM break - PROBLEMA CRÍTICO');
    }
  }

  // Verificar setInterval sem cleanup
  if (queueContent.includes('setInterval')) {
    const hasCleanup = queueContent.includes('clearInterval');
    
    if (!hasCleanup) {
      issues.push({
        file: 'src/lib/queue.ts',
        issue: 'setInterval sem clearInterval',
        severity: 'error',
        description: 'Memory leak: setInterval nunca é limpo',
        line: queueContent.split('\n').findIndex(l => l.includes('setInterval')) + 1,
        suggestion: 'Adicionar clearInterval ou usar em contexto apropriado'
      });
      console.log('❌ setInterval sem clearInterval - MEMORY LEAK');
    }
  }

  // Verificar console.log em produção
  const consoleMatches = queueContent.match(/console\.(log|warn)/g);
  if (consoleMatches && consoleMatches.length > 0) {
    warnings.push({
      file: 'src/lib/queue.ts',
      issue: `${consoleMatches.length} console.log/warn encontrados`,
      severity: 'warning',
      description: 'Console logs devem ser removidos ou condicionados em produção',
      suggestion: 'Usar logger apropriado ou condicionar com NODE_ENV'
    });
    console.log(`⚠️  ${consoleMatches.length} console.log/warn encontrados`);
  }

} catch (error) {
  console.log('⚠️  Arquivo queue.ts não encontrado ou erro ao ler');
}
console.log('');

// ============================================
// ANÁLISE 2: Rate Limit - Memory Storage
// ============================================
console.log('📋 Análise 2: Rate Limiting (middleware/rate-limit.ts)');
try {
  const rateLimitPath = path.join(__dirname, '../src/middleware/rate-limit.ts');
  const rateLimitContent = fs.readFileSync(rateLimitPath, 'utf8');

  // Verificar uso de Map em memória
  if (rateLimitContent.includes('new Map') && !rateLimitContent.includes('Redis')) {
    warnings.push({
      file: 'src/middleware/rate-limit.ts',
      issue: 'Rate limiting usando memória local',
      severity: 'warning',
      description: 'Em produção com múltiplas instâncias, rate limit não funcionará corretamente',
      suggestion: 'Usar Redis ou outro storage distribuído em produção'
    });
    console.log('⚠️  Rate limiting usa memória local (problema em produção multi-instância)');
  }

  // Verificar cleanup de memória
  if (rateLimitContent.includes('setInterval') && rateLimitContent.includes('cleanupExpiredRateLimits')) {
    info.push({
      file: 'src/middleware/rate-limit.ts',
      issue: 'Cleanup automático implementado',
      severity: 'info',
      description: 'Limpeza de rate limits expirados está configurada'
    });
    console.log('✅ Cleanup automático de rate limits implementado');
  }

} catch (error) {
  console.log('⚠️  Arquivo rate-limit.ts não encontrado');
}
console.log('');

// ============================================
// ANÁLISE 3: Auth Interceptor - Possível Loop
// ============================================
console.log('📋 Análise 3: Auth Interceptor');
try {
  const interceptorPath = path.join(__dirname, '../src/components/auth-interceptor.tsx');
  const interceptorContent = fs.readFileSync(interceptorPath, 'utf8');

  // Verificar se há proteção contra loop infinito de redirects
  const hasLoggingOutFlag = interceptorContent.includes('isLoggingOut');
  const hasTimeout = interceptorContent.includes('setTimeout');

  if (hasLoggingOutFlag && hasTimeout) {
    console.log('✅ Proteção contra loop de redirects implementada');
    info.push({
      file: 'src/components/auth-interceptor.tsx',
      issue: 'Proteção contra loops',
      severity: 'info',
      description: 'Flag isLoggingOut e setTimeout previnem loops infinitos'
    });
  } else {
    warnings.push({
      file: 'src/components/auth-interceptor.tsx',
      issue: 'Possível loop de redirects',
      severity: 'warning',
      description: 'Sem proteção clara contra múltiplos redirects simultâneos',
      suggestion: 'Adicionar flag de controle e debounce'
    });
    console.log('⚠️  Possível loop de redirects não totalmente protegido');
  }

  // Verificar cleanup do useEffect
  const hasCleanup = interceptorContent.includes('return () =>');
  if (hasCleanup) {
    console.log('✅ Cleanup do useEffect implementado');
  } else {
    warnings.push({
      file: 'src/components/auth-interceptor.tsx',
      issue: 'useEffect sem cleanup',
      severity: 'warning',
      description: 'Interceptor pode não ser limpo corretamente ao desmontar',
      suggestion: 'Adicionar cleanup function no useEffect'
    });
    console.log('⚠️  useEffect sem cleanup adequado');
  }

} catch (error) {
  console.log('⚠️  Arquivo auth-interceptor.tsx não encontrado');
}
console.log('');

// ============================================
// ANÁLISE 4: API Audit - Possível Timeout
// ============================================
console.log('📋 Análise 4: API Audit');
try {
  const auditPath = path.join(__dirname, '../src/app/api/audit/route.ts');
  const auditContent = fs.readFileSync(auditPath, 'utf8');

  // Verificar se há timeout nas chamadas fetch
  const hasTimeout = auditContent.includes('timeout') || auditContent.includes('AbortController');
  
  if (!hasTimeout) {
    warnings.push({
      file: 'src/app/api/audit/route.ts',
      issue: 'Fetch sem timeout',
      severity: 'warning',
      description: 'Chamadas fetch podem travar indefinidamente',
      suggestion: 'Adicionar timeout usando AbortController'
    });
    console.log('⚠️  Chamadas fetch sem timeout configurado');
  }

  // Verificar Promise.allSettled
  const hasAllSettled = auditContent.includes('Promise.allSettled');
  if (hasAllSettled) {
    console.log('✅ Usando Promise.allSettled (não falha se uma API falhar)');
    info.push({
      file: 'src/app/api/audit/route.ts',
      issue: 'Promise.allSettled usado',
      severity: 'info',
      description: 'Auditoria não falha se uma API individual falhar'
    });
  }

} catch (error) {
  console.log('⚠️  Arquivo audit/route.ts não encontrado');
}
console.log('');

// ============================================
// ANÁLISE 5: Unified Financial Context
// ============================================
console.log('📋 Análise 5: Unified Financial Context');
try {
  const contextPath = path.join(__dirname, '../src/contexts/unified-financial-context.tsx');
  const contextContent = fs.readFileSync(contextPath, 'utf8');

  // Verificar número de useEffect
  const useEffectCount = (contextContent.match(/useEffect\(/g) || []).length;
  if (useEffectCount > 5) {
    warnings.push({
      file: 'src/contexts/unified-financial-context.tsx',
      issue: `${useEffectCount} useEffect encontrados`,
      severity: 'warning',
      description: 'Muitos useEffect podem causar re-renders excessivos',
      suggestion: 'Considerar consolidar useEffects ou usar useMemo/useCallback'
    });
    console.log(`⚠️  ${useEffectCount} useEffect encontrados (pode causar performance issues)`);
  } else {
    console.log(`✅ ${useEffectCount} useEffect (quantidade razoável)`);
  }

  // Verificar uso de useMemo
  const useMemoCount = (contextContent.match(/useMemo\(/g) || []).length;
  const useCallbackCount = (contextContent.match(/useCallback\(/g) || []).length;
  
  if (useMemoCount > 0 || useCallbackCount > 0) {
    console.log(`✅ Otimizações: ${useMemoCount} useMemo, ${useCallbackCount} useCallback`);
    info.push({
      file: 'src/contexts/unified-financial-context.tsx',
      issue: 'Otimizações implementadas',
      severity: 'info',
      description: `useMemo: ${useMemoCount}, useCallback: ${useCallbackCount}`
    });
  }

} catch (error) {
  console.log('⚠️  Arquivo unified-financial-context.tsx não encontrado');
}
console.log('');

// ============================================
// RESUMO
// ============================================
console.log('═'.repeat(60));
console.log('📊 RESUMO DA ANÁLISE');
console.log('═'.repeat(60));
console.log(`❌ Problemas Críticos: ${issues.length}`);
console.log(`⚠️  Avisos: ${warnings.length}`);
console.log(`ℹ️  Informações: ${info.length}`);
console.log('═'.repeat(60));
console.log('');

// Exibir problemas críticos
if (issues.length > 0) {
  console.log('🚨 PROBLEMAS CRÍTICOS QUE PRECISAM SER CORRIGIDOS:\n');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file} (linha ${issue.line || '?'})`);
    console.log(`   Problema: ${issue.issue}`);
    console.log(`   Descrição: ${issue.description}`);
    console.log(`   Sugestão: ${issue.suggestion}`);
    console.log('');
  });
}

// Exibir avisos
if (warnings.length > 0) {
  console.log('⚠️  AVISOS (Recomendado corrigir):\n');
  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning.file}`);
    console.log(`   ${warning.issue}`);
    console.log(`   ${warning.description}`);
    if (warning.suggestion) {
      console.log(`   💡 ${warning.suggestion}`);
    }
    console.log('');
  });
}

// Salvar relatório
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    critical: issues.length,
    warnings: warnings.length,
    info: info.length,
  },
  issues,
  warnings,
  info,
};

const reportPath = path.join(__dirname, '../ANALISE-CODIGO.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Relatório completo salvo em: ANALISE-CODIGO.json`);

// Exit code
process.exit(issues.length > 0 ? 1 : 0);

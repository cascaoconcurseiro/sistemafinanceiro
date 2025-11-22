#!/usr/bin/env node

/**
 * Script para testar todas as correções aplicadas
 * Executa testes automatizados para validar as correções
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testando Correções Aplicadas...\n');

let passedTests = 0;
let failedTests = 0;

// ============================================
// TESTE 1: Verificar CSP no Middleware
// ============================================
console.log('📋 Teste 1: Content Security Policy');
try {
  const middlewarePath = path.join(__dirname, '../src/middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

  const hasGoogleFonts = middlewareContent.includes('https://fonts.googleapis.com');
  const hasGoogleFontsStatic = middlewareContent.includes('https://fonts.gstatic.com');
  const hasConnectSrc = middlewareContent.includes('connect-src');

  if (hasGoogleFonts && hasGoogleFontsStatic && hasConnectSrc) {
    console.log('✅ CSP configurado corretamente');
    console.log('   - Google Fonts permitido');
    console.log('   - Google Fonts Static permitido');
    console.log('   - connect-src configurado');
    passedTests++;
  } else {
    console.log('❌ CSP incompleto');
    if (!hasGoogleFonts) console.log('   - Faltando: Google Fonts');
    if (!hasGoogleFontsStatic) console.log('   - Faltando: Google Fonts Static');
    if (!hasConnectSrc) console.log('   - Faltando: connect-src');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar middleware:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// TESTE 2: Verificar API Audit
// ============================================
console.log('📋 Teste 2: API Audit Headers');
try {
  const auditPath = path.join(__dirname, '../src/app/api/audit/route.ts');
  const auditContent = fs.readFileSync(auditPath, 'utf8');

  const hasCookieHeader = auditContent.includes("'Cookie'");
  const hasAuthHeader = auditContent.includes("'Authorization'");
  const hasBaseUrl = auditContent.includes('baseUrl');

  if (hasCookieHeader && hasAuthHeader && hasBaseUrl) {
    console.log('✅ API Audit configurada corretamente');
    console.log('   - Cookie header propagado');
    console.log('   - Authorization header propagado');
    console.log('   - Base URL configurada');
    passedTests++;
  } else {
    console.log('❌ API Audit incompleta');
    if (!hasCookieHeader) console.log('   - Faltando: Cookie header');
    if (!hasAuthHeader) console.log('   - Faltando: Authorization header');
    if (!hasBaseUrl) console.log('   - Faltando: Base URL');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar API Audit:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// TESTE 3: Verificar Rate Limiting
// ============================================
console.log('📋 Teste 3: Rate Limiting');
try {
  const rateLimitPath = path.join(__dirname, '../src/middleware/rate-limit.ts');
  const rateLimitContent = fs.readFileSync(rateLimitPath, 'utf8');

  const loginLimitMatch = rateLimitContent.match(/\/api\/auth\/login.*?maxRequests:\s*(\d+)/s);
  const loginLimit = loginLimitMatch ? parseInt(loginLimitMatch[1]) : 0;

  if (loginLimit >= 10) {
    console.log('✅ Rate Limiting configurado corretamente');
    console.log(`   - Login: ${loginLimit} tentativas permitidas`);
    passedTests++;
  } else {
    console.log('❌ Rate Limiting muito restritivo');
    console.log(`   - Login: apenas ${loginLimit} tentativas`);
    console.log('   - Recomendado: 10 tentativas');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar Rate Limiting:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// TESTE 4: Verificar Manifest PWA
// ============================================
console.log('📋 Teste 4: PWA Manifest');
try {
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  const hasCorrectIcons = manifest.icons.every(icon => 
    icon.src.includes('192x192') || icon.src.includes('512x512')
  );

  const hasCorrectShortcuts = manifest.shortcuts?.every(shortcut =>
    shortcut.icons[0].src.includes('192x192')
  ) ?? true;

  if (hasCorrectIcons && hasCorrectShortcuts) {
    console.log('✅ Manifest configurado corretamente');
    console.log('   - Ícones principais: OK');
    console.log('   - Ícones de shortcuts: OK');
    passedTests++;
  } else {
    console.log('❌ Manifest com problemas');
    if (!hasCorrectIcons) console.log('   - Ícones principais incorretos');
    if (!hasCorrectShortcuts) console.log('   - Ícones de shortcuts incorretos');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar Manifest:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// TESTE 5: Verificar Auth Interceptor
// ============================================
console.log('📋 Teste 5: Auth Interceptor');
try {
  const interceptorPath = path.join(__dirname, '../src/components/auth-interceptor.tsx');
  const interceptorContent = fs.readFileSync(interceptorPath, 'utf8');

  const hasPublicPaths = interceptorContent.includes('publicPaths');
  const hasPathname = interceptorContent.includes('usePathname');
  const hasRouter = interceptorContent.includes('useRouter');
  const has401Handling = interceptorContent.includes('401');

  if (hasPublicPaths && hasPathname && hasRouter && has401Handling) {
    console.log('✅ Auth Interceptor configurado corretamente');
    console.log('   - Rotas públicas definidas');
    console.log('   - Pathname verificado');
    console.log('   - Router configurado');
    console.log('   - Tratamento de 401 implementado');
    passedTests++;
  } else {
    console.log('❌ Auth Interceptor incompleto');
    if (!hasPublicPaths) console.log('   - Faltando: rotas públicas');
    if (!hasPathname) console.log('   - Faltando: usePathname');
    if (!hasRouter) console.log('   - Faltando: useRouter');
    if (!has401Handling) console.log('   - Faltando: tratamento de 401');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar Auth Interceptor:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// TESTE 6: Verificar Error Handler
// ============================================
console.log('📋 Teste 6: Error Handler Utility');
try {
  const errorHandlerPath = path.join(__dirname, '../src/lib/utils/error-handler.ts');
  
  if (fs.existsSync(errorHandlerPath)) {
    const errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf8');

    const hasApiError = errorHandlerContent.includes('class ApiError');
    const hasFetchWrapper = errorHandlerContent.includes('fetchWithErrorHandling');
    const hasAuthCheck = errorHandlerContent.includes('isAuthError');
    const hasRateLimitCheck = errorHandlerContent.includes('isRateLimitError');

    if (hasApiError && hasFetchWrapper && hasAuthCheck && hasRateLimitCheck) {
      console.log('✅ Error Handler criado corretamente');
      console.log('   - ApiError class: OK');
      console.log('   - fetchWithErrorHandling: OK');
      console.log('   - isAuthError: OK');
      console.log('   - isRateLimitError: OK');
      passedTests++;
    } else {
      console.log('❌ Error Handler incompleto');
      if (!hasApiError) console.log('   - Faltando: ApiError class');
      if (!hasFetchWrapper) console.log('   - Faltando: fetchWithErrorHandling');
      if (!hasAuthCheck) console.log('   - Faltando: isAuthError');
      if (!hasRateLimitCheck) console.log('   - Faltando: isRateLimitError');
      failedTests++;
    }
  } else {
    console.log('❌ Error Handler não encontrado');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar Error Handler:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// TESTE 7: Verificar Ícones PWA
// ============================================
console.log('📋 Teste 7: Ícones PWA');
try {
  const icon192 = path.join(__dirname, '../public/icon-192x192.png');
  const icon512 = path.join(__dirname, '../public/icon-512x512.png');

  const has192 = fs.existsSync(icon192);
  const has512 = fs.existsSync(icon512);

  if (has192 && has512) {
    console.log('✅ Ícones PWA existem');
    console.log('   - icon-192x192.png: OK');
    console.log('   - icon-512x512.png: OK');
    passedTests++;
  } else {
    console.log('❌ Ícones PWA faltando');
    if (!has192) console.log('   - Faltando: icon-192x192.png');
    if (!has512) console.log('   - Faltando: icon-512x512.png');
    failedTests++;
  }
} catch (error) {
  console.log('❌ Erro ao verificar ícones:', error.message);
  failedTests++;
}
console.log('');

// ============================================
// RESUMO
// ============================================
console.log('═'.repeat(50));
console.log('📊 RESUMO DOS TESTES');
console.log('═'.repeat(50));
console.log(`✅ Testes Passados: ${passedTests}`);
console.log(`❌ Testes Falhados: ${failedTests}`);
console.log(`📈 Taxa de Sucesso: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
console.log('═'.repeat(50));

if (failedTests === 0) {
  console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
  console.log('✨ Próximo passo: Testar no navegador');
  console.log('');
  console.log('Comandos para testar:');
  console.log('  1. npm run dev');
  console.log('  2. Abrir http://localhost:3000');
  console.log('  3. Verificar console do navegador');
  console.log('  4. Fazer login e testar funcionalidades');
  process.exit(0);
} else {
  console.log('\n⚠️  Algumas correções precisam de atenção');
  console.log('📖 Consulte o GUIA-CORRECOES-COMPLETO.md para mais detalhes');
  process.exit(1);
}

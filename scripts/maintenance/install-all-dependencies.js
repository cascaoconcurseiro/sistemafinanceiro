/**
 * SCRIPT: Instalar Todas as Dependências para Produção
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 INSTALANDO DEPENDÊNCIAS PARA PRODUÇÃO\n');
console.log('='.repeat(70));

const dependencies = [
  // Error Tracking
  { name: '@sentry/nextjs', dev: false, desc: 'Error tracking' },
  
  // Testing
  { name: 'jest', dev: true, desc: 'Test runner' },
  { name: '@testing-library/react', dev: true, desc: 'React testing' },
  { name: '@testing-library/jest-dom', dev: true, desc: 'Jest matchers' },
  { name: '@testing-library/user-event', dev: true, desc: 'User interactions' },
  { name: '@swc/jest', dev: true, desc: 'Fast Jest transformer' },
  { name: 'supertest', dev: true, desc: 'API testing' },
  
  // Acessibilidade
  { name: 'eslint-plugin-jsx-a11y', dev: true, desc: 'Accessibility linting' },
  
  // Segurança
  { name: 'bcryptjs', dev: false, desc: 'Password hashing' },
  { name: '@types/bcryptjs', dev: true, desc: 'Bcrypt types' },
];

let installed = 0;
let failed = 0;

for (const dep of dependencies) {
  try {
    console.log(`\n📦 Instalando ${dep.name}...`);
    console.log(`   ${dep.desc}`);
    
    const flag = dep.dev ? '--save-dev' : '--save';
    execSync(`npm install ${flag} ${dep.name}`, { 
      stdio: 'inherit',
      cwd: __dirname + '/..',
    });
    
    console.log(`   ✅ Instalado`);
    installed++;
  } catch (error) {
    console.error(`   ❌ Erro ao instalar ${dep.name}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(70));
console.log('📊 RESUMO');
console.log('='.repeat(70));
console.log(`✅ Instaladas: ${installed}`);
console.log(`❌ Falharam: ${failed}`);
console.log(`📋 Total: ${dependencies.length}`);
console.log('='.repeat(70));

if (failed === 0) {
  console.log('\n🎉 TODAS AS DEPENDÊNCIAS INSTALADAS COM SUCESSO!\n');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('');
  console.log('1. Configurar Sentry:');
  console.log('   - Criar conta em https://sentry.io');
  console.log('   - Adicionar SENTRY_DSN no .env');
  console.log('');
  console.log('2. Executar testes:');
  console.log('   npm test');
  console.log('');
  console.log('3. Configurar backup automático:');
  console.log('   PowerShell: .\\scripts\\setup-backup-windows.ps1');
  console.log('');
  console.log('4. Executar auditoria:');
  console.log('   node scripts/professional-audit.js');
  console.log('');
} else {
  console.log('\n⚠️ ALGUMAS DEPENDÊNCIAS FALHARAM');
  console.log('Tente instalar manualmente as que falharam.');
}

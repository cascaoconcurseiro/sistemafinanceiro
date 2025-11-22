#!/usr/bin/env node

/**
 * Script para corrigir configuração do ESLint
 * e aplicar correções automáticas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Corrigindo Configuração do ESLint...\n');

// ============================================
// TAREFA 1: Atualizar .eslintrc.json
// ============================================
console.log('📋 Tarefa 1: Atualizando .eslintrc.json');
try {
  const eslintrcPath = path.join(__dirname, '../.eslintrc.json');
  const eslintConfig = JSON.parse(fs.readFileSync(eslintrcPath, 'utf8'));

  // Atualizar regras críticas
  eslintConfig.rules = {
    ...eslintConfig.rules,
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'prefer-const': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
  };

  fs.writeFileSync(eslintrcPath, JSON.stringify(eslintConfig, null, 2));
  console.log('✅ .eslintrc.json atualizado com regras críticas');
} catch (error) {
  console.log('❌ Erro ao atualizar .eslintrc.json:', error.message);
}
console.log('');

// ============================================
// TAREFA 2: Executar ESLint --fix
// ============================================
console.log('📋 Tarefa 2: Executando ESLint --fix');
try {
  console.log('⏳ Isso pode levar alguns minutos...\n');
  
  execSync('npx eslint . --ext .ts,.tsx --fix', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  
  console.log('\n✅ ESLint --fix executado com sucesso');
} catch (error) {
  console.log('\n⚠️  ESLint encontrou alguns problemas que não puderam ser corrigidos automaticamente');
  console.log('Execute: npm run lint para ver os detalhes');
}
console.log('');

// ============================================
// TAREFA 3: Verificar warnings restantes
// ============================================
console.log('📋 Tarefa 3: Verificando warnings restantes');
try {
  const output = execSync('npx eslint . --ext .ts,.tsx --format json', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });
  
  const results = JSON.parse(output);
  const totalWarnings = results.reduce((sum, file) => sum + file.warningCount, 0);
  const totalErrors = results.reduce((sum, file) => sum + file.errorCount, 0);
  
  console.log(`📊 Resultados:`);
  console.log(`   Erros: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);
  
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ Nenhum problema encontrado!');
  } else if (totalErrors === 0) {
    console.log('⚠️  Alguns warnings ainda precisam de atenção manual');
  } else {
    console.log('❌ Alguns erros precisam ser corrigidos manualmente');
  }
} catch (error) {
  console.log('⚠️  Não foi possível verificar warnings');
}
console.log('');

console.log('✨ Correção do ESLint concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Revisar warnings restantes: npm run lint');
console.log('2. Corrigir manualmente se necessário');
console.log('3. Executar: node scripts/remove-dead-code.js');

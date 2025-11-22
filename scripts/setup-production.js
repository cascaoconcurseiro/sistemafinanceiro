/**
 * SCRIPT MASTER: Configuração Completa para Produção
 * 
 * Executa TUDO que é necessário para preparar o sistema para produção
 */

const { execSync } = require('child_process');
const fs = require('path');
const path = require('path');

console.log('🚀 CONFIGURAÇÃO COMPLETA PARA PRODUÇÃO\n');
console.log('='.repeat(70));
console.log('\nEste script irá:');
console.log('1. Instalar todas as dependências');
console.log('2. Configurar backup automático');
console.log('3. Executar migrations');
console.log('4. Gerar Prisma Client');
console.log('5. Executar testes');
console.log('6. Executar auditoria');
console.log('7. Criar backup inicial');
console.log('\n' + '='.repeat(70));

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('\n🤔 Deseja continuar? (s/n): ', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() !== 's') {
    console.log('\n❌ Cancelado pelo usuário');
    process.exit(0);
  }
  
  runSetup();
});

async function runSetup() {
  const steps = [
    {
      name: 'Instalar dependências',
      command: 'node scripts/install-all-dependencies.js',
      critical: true,
    },
    {
      name: 'Executar migrations',
      command: 'npx prisma migrate deploy',
      critical: true,
    },
    {
      name: 'Gerar Prisma Client',
      command: 'npx prisma generate',
      critical: true,
    },
    {
      name: 'Executar testes',
      command: 'npm test',
      critical: false,
    },
    {
      name: 'Criar backup inicial',
      command: 'node scripts/backup-database.js create',
      critical: true,
    },
    {
      name: 'Executar auditoria',
      command: 'node scripts/professional-audit.js',
      critical: false,
    },
  ];

  let completed = 0;
  let failed = 0;

  for (const step of steps) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 ${step.name}...`);
    console.log('='.repeat(70));
    
    try {
      execSync(step.command, { stdio: 'inherit' });
      console.log(`\n✅ ${step.name} - Concluído`);
      completed++;
    } catch (error) {
      console.error(`\n❌ ${step.name} - Falhou`);
      failed++;
      
      if (step.critical) {
        console.error('\n🚨 ERRO CRÍTICO! Abortando configuração.');
        process.exit(1);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(70));
  console.log(`✅ Concluídas: ${completed}`);
  console.log(`❌ Falharam: ${failed}`);
  console.log(`📋 Total: ${steps.length}`);
  console.log('='.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 CONFIGURAÇÃO COMPLETA COM SUCESSO!\n');
    console.log('📋 SISTEMA PRONTO PARA PRODUÇÃO');
    console.log('');
    console.log('📊 Próximos passos:');
    console.log('1. Configurar variáveis de ambiente de produção');
    console.log('2. Configurar Sentry (SENTRY_DSN)');
    console.log('3. Executar: npm run build');
    console.log('4. Deploy para servidor');
    console.log('');
  } else {
    console.log('\n⚠️ CONFIGURAÇÃO CONCLUÍDA COM AVISOS');
    console.log(`${failed} etapa(s) falharam, mas não são críticas.`);
    console.log('Revise os erros acima.');
  }
}

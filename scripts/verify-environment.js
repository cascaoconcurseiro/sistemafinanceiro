#!/usr/bin/env node

console.log('\n🔍 Verificando configuração do ambiente...\n');
console.log('═'.repeat(60));

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CRON_SECRET',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
];

const optionalVars = [
  'ALLOWED_ORIGINS',
  'RATE_LIMIT_MAX',
  'RATE_LIMIT_WINDOW',
  'BACKUP_ENABLED',
  'LOG_LEVEL',
  'SENTRY_DSN',
  'SMTP_HOST',
];

let hasErrors = false;
let hasWarnings = false;

console.log('\n✅ Variáveis Obrigatórias:\n');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ❌ ${varName}: NÃO CONFIGURADA`);
    hasErrors = true;
  } else {
    const displayValue = varName.includes('SECRET') || varName.includes('URL') 
      ? '***' + value.slice(-4) 
      : value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n⚠️  Variáveis Opcionais:\n');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`   ⚠️  ${varName}: não configurada (opcional)`);
    hasWarnings = true;
  } else {
    const displayValue = varName.includes('SECRET') || varName.includes('URL') 
      ? '***' + value.slice(-4) 
      : value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n' + '═'.repeat(60));

if (hasErrors) {
  console.log('\n❌ ERRO: Variáveis obrigatórias não configuradas!');
  console.log('\n📝 Execute: node scripts/generate-secrets.js');
  console.log('   E configure as variáveis no Netlify\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  AVISO: Algumas variáveis opcionais não estão configuradas');
  console.log('   O sistema funcionará, mas com funcionalidades limitadas\n');
} else {
  console.log('\n✅ Todas as variáveis estão configuradas corretamente!\n');
}

// Verificar DATABASE_URL
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('postgresql://')) {
    console.log('✅ DATABASE_URL: PostgreSQL detectado');
    if (!dbUrl.includes('sslmode=require') && process.env.NODE_ENV === 'production') {
      console.log('⚠️  Considere adicionar ?sslmode=require à DATABASE_URL em produção');
    }
  } else if (dbUrl.startsWith('file:')) {
    console.log('⚠️  DATABASE_URL: SQLite detectado (não recomendado para produção)');
  }
}

// Verificar JWT_SECRET length
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.log('⚠️  JWT_SECRET muito curto! Recomendado: mínimo 32 caracteres');
}

console.log('\n' + '═'.repeat(60) + '\n');

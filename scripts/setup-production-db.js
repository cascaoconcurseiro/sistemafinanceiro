#!/usr/bin/env node

/**
 * Script para configurar o banco de dados de produção
 * 
 * USO:
 * 1. Configure a DATABASE_URL no Netlify
 * 2. Execute localmente com a URL de produção:
 *    DATABASE_URL="sua-url-aqui" node scripts/setup-production-db.js
 */

const { execSync } = require('child_process');

console.log('\n🗄️  Configurando banco de dados de produção...\n');
console.log('═'.repeat(60));

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERRO: DATABASE_URL não está configurada!');
  console.log('\n📝 Execute assim:');
  console.log('   DATABASE_URL="sua-url" node scripts/setup-production-db.js\n');
  process.exit(1);
}

// Verificar se é PostgreSQL
if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('\n❌ ERRO: DATABASE_URL deve ser PostgreSQL!');
  console.log('   Formato: postgresql://user:pass@host/db?sslmode=require\n');
  process.exit(1);
}

console.log('\n✅ DATABASE_URL configurada');
console.log('   Host:', process.env.DATABASE_URL.match(/@([^/]+)/)?.[1] || 'unknown');

try {
  console.log('\n📦 Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n🔄 Executando migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('\n✅ Banco de dados configurado com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Configure todas as variáveis de ambiente no Netlify');
  console.log('   2. Faça um novo deploy');
  console.log('   3. Teste o site\n');
  
} catch (error) {
  console.error('\n❌ Erro ao configurar banco de dados:', error.message);
  console.log('\n🔍 Verifique:');
  console.log('   - A DATABASE_URL está correta?');
  console.log('   - O banco está acessível?');
  console.log('   - Você tem permissões de escrita?\n');
  process.exit(1);
}

console.log('═'.repeat(60) + '\n');

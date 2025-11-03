#!/usr/bin/env node

/**
 * Script para testar conexão com Neon Database
 * 
 * USO:
 * DATABASE_URL="sua-url" node scripts/test-neon-connection.js
 */

const { PrismaClient } = require('@prisma/client');

console.log('\n🔍 Testando conexão com Neon Database...\n');
console.log('═'.repeat(60));

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERRO: DATABASE_URL não está configurada!');
  console.log('\n📝 Execute assim:');
  console.log('   DATABASE_URL="sua-url" node scripts/test-neon-connection.js\n');
  process.exit(1);
}

// Verificar formato da URL
const dbUrl = process.env.DATABASE_URL;
console.log('\n📋 Informações da conexão:');

if (dbUrl.startsWith('postgresql://')) {
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
  if (match) {
    const [, user, pass, host, database] = match;
    console.log(`   User: ${user}`);
    console.log(`   Password: ${'*'.repeat(pass.length)}`);
    console.log(`   Host: ${host}`);
    console.log(`   Database: ${database}`);
    
    // Verificar se está usando pooler
    if (host.includes('-pooler')) {
      console.log('   ✅ Usando connection pooling (recomendado)');
    } else {
      console.log('   ⚠️  Conexão direta (considere usar -pooler)');
    }
    
    // Verificar SSL
    if (dbUrl.includes('sslmode=require')) {
      console.log('   ✅ SSL habilitado');
    } else {
      console.log('   ⚠️  SSL não configurado (adicione ?sslmode=require)');
    }
  }
} else {
  console.log('   ⚠️  Formato de URL não reconhecido');
}

console.log('\n' + '─'.repeat(60));

// Testar conexão
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('\n🔌 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('\n📊 Testando query...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Query executada com sucesso!');
    console.log('   PostgreSQL version:', result[0].version.split(' ')[0], result[0].version.split(' ')[1]);
    
    console.log('\n🗄️  Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada');
      console.log('\n📝 Execute as migrations:');
      console.log('   npx prisma migrate deploy');
    } else {
      console.log(`✅ ${tables.length} tabela(s) encontrada(s):`);
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    
    if (tables.length === 0) {
      console.log('   1. Execute: npx prisma migrate deploy');
      console.log('   2. Configure as variáveis de ambiente no Netlify');
      console.log('   3. Faça o deploy');
    } else {
      console.log('   1. Configure as variáveis de ambiente no Netlify');
      console.log('   2. Faça o deploy');
      console.log('   3. Teste o site');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error.message);
    
    console.log('\n🔍 Possíveis causas:');
    console.log('   - URL de conexão incorreta');
    console.log('   - Senha incorreta');
    console.log('   - Firewall bloqueando conexão');
    console.log('   - Banco de dados não existe');
    console.log('   - SSL não configurado corretamente');
    
    console.log('\n📝 Soluções:');
    console.log('   1. Verifique a DATABASE_URL no Neon Console');
    console.log('   2. Certifique-se de usar a Pooled Connection');
    console.log('   3. Adicione ?sslmode=require ao final da URL');
    console.log('   4. Teste de outra rede se possível');
    console.log('\n');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

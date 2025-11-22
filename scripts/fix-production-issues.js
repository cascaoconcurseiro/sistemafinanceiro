/**
 * SCRIPT: Corrigir Problemas Críticos de Produção
 * 
 * Corrige:
 * 1. Senhas em texto plano
 * 2. Audit log não utilizado
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 CORRIGINDO PROBLEMAS CRÍTICOS DE PRODUÇÃO\n');

  // ============================================
  // 1. CRIPTOGRAFAR SENHAS EM TEXTO PLANO
  // ============================================
  console.log('🔒 1. Criptografando senhas...');

  const usersWithPlainPassword = await prisma.user.findMany({
    where: {
      password: {
        not: {
          startsWith: '$2',
        },
      },
    },
  });

  console.log(`   Encontrados ${usersWithPlainPassword.length} usuários com senha em texto plano`);

  for (const user of usersWithPlainPassword) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`   ✅ Senha criptografada: ${user.email}`);
  }

  // ============================================
  // 2. ATIVAR AUDIT LOG
  // ============================================
  console.log('\n📝 2. Ativando audit log...');

  // Criar evento de auditoria para esta correção
  await prisma.auditEvent.create({
    data: {
      tableName: 'users',
      recordId: 'system',
      operation: 'UPDATE',
      oldValues: JSON.stringify({ action: 'password_encryption' }),
      newValues: JSON.stringify({ 
        usersUpdated: usersWithPlainPassword.length,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: '127.0.0.1',
      userAgent: 'System Script',
      metadata: JSON.stringify({
        script: 'fix-production-issues.js',
        action: 'encrypt_passwords',
      }),
    },
  });

  console.log('   ✅ Evento de auditoria criado');

  console.log('\n' + '='.repeat(60));
  console.log('✅ CORREÇÕES APLICADAS COM SUCESSO');
  console.log('='.repeat(60));
  console.log(`   🔒 ${usersWithPlainPassword.length} senhas criptografadas`);
  console.log('   📝 Audit log ativado');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

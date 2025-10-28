const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'senha123';

    if (!email) {
      console.log('❌ Uso: node scripts/reset-user-password.js <email> [nova-senha]');
      console.log('   Exemplo: node scripts/reset-user-password.js usuario@exemplo.com senha123');
      return;
    }

    console.log(`🔍 Buscando usuário: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);

    if (!user.isActive) {
      console.log('\n⚠️  Usuário está inativo. Ativando...');
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true }
      });
      console.log('✅ Usuário ativado');
    }

    console.log(`\n🔄 Resetando senha para: ${newPassword}`);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Senha resetada com sucesso!');
    console.log(`\n📋 Credenciais de login:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Senha: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword();

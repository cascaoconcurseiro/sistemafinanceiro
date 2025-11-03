const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'admin@suagrana.com';
    const newPassword = 'admin123'; // Senha temporária
    
    console.log('🔐 Resetando senha...\n');
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar usuário
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Senha resetada com sucesso!\n');
    console.log('📧 Email:', email);
    console.log('🔑 Nova senha:', newPassword);
    console.log('\n⚠️  IMPORTANTE: Troque esta senha após fazer login!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();

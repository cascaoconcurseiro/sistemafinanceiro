const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createFirstUser() {
  try {
    console.log('🔄 Criando primeiro usuário...\n');

    // Verificar se já existe algum usuário
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      console.log('✅ Já existem usuários no banco!');
      console.log(`   Total: ${existingUsers} usuário(s)\n`);
      
      const users = await prisma.user.findMany({
        select: { email: true, name: true }
      });
      
      console.log('Usuários existentes:');
      users.forEach(u => console.log(`   - ${u.name} (${u.email})`));
      return;
    }

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@suagrana.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      }
    });

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📧 Email: admin@suagrana.com');
    console.log('🔑 Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstUser();

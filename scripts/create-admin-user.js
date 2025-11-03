const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔍 Verificando usuário admin...');

    // Verificar se já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nome:', existingAdmin.name);
      console.log('🔑 ID:', existingAdmin.id);
      return;
    }

    console.log('📝 Criando usuário admin...');

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@suagrana.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      }
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@suagrana.com');
    console.log('🔑 Senha: admin123');
    console.log('👤 ID:', admin.id);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

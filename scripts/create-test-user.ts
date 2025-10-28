import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (existingUser) {
      console.log('✅ Usuário de teste já existe!');
      console.log('📧 Email: admin@suagrana.com');
      console.log('🔑 Senha: admin123');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'admin@suagrana.com',
        name: 'Administrador',
        password: hashedPassword,
        isActive: true,
      }
    });

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log(`👤 ID: ${user.id}`);
    console.log('📧 Email: admin@suagrana.com');
    console.log('🔑 Senha: admin123');
    console.log('');
    console.log('🎉 Agora você pode fazer login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

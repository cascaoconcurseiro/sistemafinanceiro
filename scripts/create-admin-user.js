require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Criando/Atualizando usuário administrador...\n');

    const email = 'adm@suagrana.com.br';
    const password = '834702';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Atualizar usuário existente
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          name: 'Administrador',
        }
      });

      console.log('✅ Usuário administrador atualizado!');
      console.log(`   ID: ${updatedUser.id}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Nome: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
    } else {
      // Criar novo usuário
      const newUser = await prisma.user.create({
        data: {
          email,
          name: 'Administrador',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        }
      });

      console.log('✅ Usuário administrador criado!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Nome: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
    }

    console.log('\n📧 Credenciais de acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log('\n🔒 Acesse: http://localhost:3000/auth/login');
    console.log('   Você será redirecionado para /admin após o login\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

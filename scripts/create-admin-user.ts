import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Criando usuário admin...');

  const email = 'admin@suagrana.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Verificar se o usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('⚠️  Usuário admin já existe. Atualizando senha...');
    
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Senha do admin atualizada com sucesso!');
  } else {
    console.log('➕ Criando novo usuário admin...');
    
    await prisma.user.create({
      data: {
        email,
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        monthlyIncome: 0,
        emergencyReserve: 0,
      },
    });

    console.log('✅ Usuário admin criado com sucesso!');
  }

  console.log('\n📋 Credenciais:');
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${password}`);
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testando login do admin...\n');

  const email = 'admin@suagrana.com';
  const password = 'admin123';

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      isActive: true,
      role: true,
    },
  });

  if (!user) {
    console.log('❌ Usuário não encontrado!');
    return;
  }

  console.log('✅ Usuário encontrado:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Ativo: ${user.isActive}`);
  console.log(`   Hash da senha: ${user.password.substring(0, 20)}...`);

  // Testar senha
  console.log('\n🔑 Testando senha...');
  const isValid = await bcrypt.compare(password, user.password);

  if (isValid) {
    console.log('✅ Senha CORRETA! O login deve funcionar.');
  } else {
    console.log('❌ Senha INCORRETA! Atualizando...');
    
    const newHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: newHash },
    });
    
    console.log('✅ Senha atualizada com sucesso!');
  }

  console.log('\n📋 Credenciais para teste:');
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando email do admin...\n');

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'admin@suagrana.com' },
        { email: 'ADMIN@SUAGRANA.COM' },
        { email: { contains: 'admin' } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      role: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ Nenhum usuário admin encontrado!');
    return;
  }

  console.log(`✅ Encontrados ${users.length} usuário(s):\n`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: "${user.email}"`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Ativo: ${user.isActive}`);
    console.log(`   Email lowercase: ${user.email.toLowerCase()}`);
    console.log(`   Email === 'admin@suagrana.com': ${user.email === 'admin@suagrana.com'}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

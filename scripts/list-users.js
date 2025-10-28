const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('🔍 Buscando todos os usuários...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            categories: true,
            accounts: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total de usuários: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.isActive ? '✅ Ativo' : '❌ Inativo'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Categorias: ${user._count.categories}`);
      console.log(`   Contas: ${user._count.accounts}`);
      console.log(`   Transações: ${user._count.transactions}`);
      console.log(`   Criado em: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
      console.log('');
    });

    console.log('💡 Para resetar senha de um usuário:');
    console.log('   node scripts/reset-user-password.js <email> <nova-senha>');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

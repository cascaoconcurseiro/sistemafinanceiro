import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👋 Criando notificação de boas-vindas...');

  // Buscar todos os usuários
  const users = await prisma.user.findMany({
    where: { role: 'USER' }, // Apenas usuários normais
  });

  for (const user of users) {
    // Verificar se já tem notificação de boas-vindas
    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        title: '👋 Bem-vindo!',
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'info',
          title: '👋 Bem-vindo!',
          message: 'Sistema de notificações ativo. Você receberá alertas sobre contas, metas e orçamentos.',
          isRead: false,
        },
      });
      console.log(`✅ Notificação criada para: ${user.email}`);
    } else {
      console.log(`ℹ️  Notificação já existe para: ${user.email}`);
    }
  }

  console.log('✨ Concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

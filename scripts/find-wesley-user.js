const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findWesleyUser() {
  try {
    console.log('🔍 Procurando usuário com dados de Wesley...\n');

    // Buscar todos os usuários
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Buscar membros da família
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id }
      });

      // Verificar se tem Wesley ou carro
      const hasWesley = familyMembers.some(m => 
        m.name.toLowerCase().includes('wesley')
      );
      const hasCarro = familyMembers.some(m => 
        m.name.toLowerCase().includes('carro')
      );

      if (hasWesley || hasCarro) {
        console.log('✅ USUÁRIO ENCONTRADO!');
        console.log('📧 Email:', user.email);
        console.log('👤 Nome:', user.name);
        console.log('🆔 ID:', user.id);
        console.log('');

        // Contar dados
        const [accounts, transactions, trips, goals] = await Promise.all([
          prisma.account.count({ where: { userId: user.id, deletedAt: null } }),
          prisma.transaction.count({ where: { userId: user.id, deletedAt: null } }),
          prisma.trip.count({ where: { userId: user.id } }),
          prisma.goal?.count?.({ where: { userId: user.id } }).catch(() => 0) || 0
        ]);

        console.log('📊 Dados do usuário:');
        console.log('  💰 Contas:', accounts);
        console.log('  💸 Transações:', transactions);
        console.log('  ✈️  Viagens:', trips);
        console.log('  🎯 Metas:', goals);
        console.log('  👨‍👩‍👧‍👦 Membros da família:', familyMembers.length);
        console.log('');

        console.log('👨‍👩‍👧‍👦 Membros da família:');
        familyMembers.forEach(m => {
          console.log(`  - ${m.name} (${m.relationship || 'sem relação'})`);
        });
        console.log('');

        // Mostrar algumas transações
        if (transactions > 0) {
          const recentTransactions = await prisma.transaction.findMany({
            where: { userId: user.id, deletedAt: null },
            orderBy: { date: 'desc' },
            take: 10,
            include: {
              account: { select: { name: true } }
            }
          });

          console.log('📝 Últimas 10 transações:');
          recentTransactions.forEach((t, i) => {
            const date = new Date(t.date).toLocaleDateString('pt-BR');
            console.log(`  ${i + 1}. ${date} - ${t.description} - R$ ${t.amount} (${t.account?.name || 'Sem conta'})`);
          });
        }

        return;
      }
    }

    console.log('❌ Nenhum usuário encontrado com Wesley ou carro na família');
    console.log('');
    console.log('📋 Todos os usuários no sistema:');
    for (const user of users) {
      const familyMembers = await prisma.familyMember.findMany({
        where: { userId: user.id }
      });
      console.log(`  - ${user.email} (${familyMembers.length} membros da família)`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findWesleyUser();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️ Limpando banco de dados...\n');
    
    // 1. Buscar admin
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@suagrana.com' }
    });
    
    if (!admin) {
      console.log('❌ Admin não encontrado!');
      return;
    }
    
    console.log('✅ Admin encontrado:', admin.email);
    
    // 2. Deletar todos os dados relacionados de outros usuários
    console.log('\n🗑️ Deletando dados de outros usuários...');
    
    // Deletar em ordem (respeitando foreign keys)
    await prisma.transactionAudit.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.journalEntry.deleteMany({});
    await prisma.scheduledTransaction.deleteMany({});
    await prisma.sharedExpense.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.sharedDebt.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.debtPayment.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.transaction.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.invoicePayment.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.invoice.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.account.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.budget.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.category.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.goal.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.investment.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.creditCard.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.familyMember.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.notification.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.reminder.deleteMany({ where: { userId: { not: admin.id } } });
    await prisma.trip.deleteMany({ where: { userId: { not: admin.id } } });
    
    console.log('✅ Dados relacionados deletados');
    
    // 3. Deletar outros usuários
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { not: admin.id } }
    });
    
    console.log(`✅ ${deletedUsers.count} usuários deletados`);
    
    // 4. Limpar dados do admin também
    console.log('\n🗑️ Limpando dados do admin...');
    await prisma.transactionAudit.deleteMany({ where: { userId: admin.id } });
    await prisma.journalEntry.deleteMany({});
    await prisma.scheduledTransaction.deleteMany({});
    await prisma.sharedExpense.deleteMany({ where: { userId: admin.id } });
    await prisma.sharedDebt.deleteMany({ where: { userId: admin.id } });
    await prisma.debtPayment.deleteMany({ where: { userId: admin.id } });
    await prisma.transaction.deleteMany({ where: { userId: admin.id } });
    await prisma.invoicePayment.deleteMany({ where: { userId: admin.id } });
    await prisma.invoice.deleteMany({ where: { userId: admin.id } });
    await prisma.account.deleteMany({ where: { userId: admin.id } });
    await prisma.budget.deleteMany({ where: { userId: admin.id } });
    await prisma.category.deleteMany({ where: { userId: admin.id } });
    await prisma.goal.deleteMany({ where: { userId: admin.id } });
    await prisma.investment.deleteMany({ where: { userId: admin.id } });
    await prisma.creditCard.deleteMany({ where: { userId: admin.id } });
    await prisma.familyMember.deleteMany({ where: { userId: admin.id } });
    await prisma.notification.deleteMany({ where: { userId: admin.id } });
    await prisma.reminder.deleteMany({ where: { userId: admin.id } });
    await prisma.trip.deleteMany({ where: { userId: admin.id } });
    
    console.log('✅ Dados do admin limpos');
    
    // 5. Verificar resultado
    const users = await prisma.user.findMany();
    console.log('\n📊 Usuários restantes:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });
    
    console.log('\n✅ Banco de dados resetado com sucesso!');
    console.log('⚠️  Agora faça logout e login novamente no sistema');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();

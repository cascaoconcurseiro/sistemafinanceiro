const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function transferTransactions() {
  try {
    console.log('🔄 TRANSFERINDO TRANSAÇÕES\n');
    
    const fromEmail = 'admin@suagrana.com';
    const toEmail = 'usuario@exemplo.com';
    
    // Buscar usuários
    const fromUser = await prisma.user.findUnique({ where: { email: fromEmail } });
    const toUser = await prisma.user.findUnique({ where: { email: toEmail } });
    
    if (!fromUser || !toUser) {
      console.log('❌ Usuário não encontrado!');
      return;
    }
    
    console.log(`De: ${fromEmail} (${fromUser.id})`);
    console.log(`Para: ${toEmail} (${toUser.id})\n`);
    
    // Contar transações
    const count = await prisma.transaction.count({
      where: { userId: fromUser.id, deletedAt: null }
    });
    
    console.log(`📊 Transações a transferir: ${count}\n`);
    
    if (count === 0) {
      console.log('⚠️  Nenhuma transação para transferir!');
      return;
    }
    
    // Transferir
    const result = await prisma.transaction.updateMany({
      where: { userId: fromUser.id, deletedAt: null },
      data: { userId: toUser.id }
    });
    
    console.log(`✅ ${result.count} transações transferidas!\n`);
    
    // Transferir contas também
    const accountsCount = await prisma.account.count({
      where: { userId: fromUser.id }
    });
    
    if (accountsCount > 0) {
      const accountsResult = await prisma.account.updateMany({
        where: { userId: fromUser.id },
        data: { userId: toUser.id }
      });
      console.log(`✅ ${accountsResult.count} contas transferidas!\n`);
    }
    
    console.log('🎉 Transferência concluída!');
    console.log('💡 Agora faça login com usuario@exemplo.com');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

transferTransactions();

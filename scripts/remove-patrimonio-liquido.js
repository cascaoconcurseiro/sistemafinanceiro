const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removePatrimonioLiquido() {
  try {
    console.log('🔍 Buscando contas "Patrimônio Líquido"...');
    
    const patrimonioAccounts = await prisma.account.findMany({
      where: {
        name: 'Patrimônio Líquido',
        type: 'PASSIVO'
      }
    });

    console.log(`📊 Encontradas ${patrimonioAccounts.length} contas`);

    if (patrimonioAccounts.length > 0) {
      console.log('🗑️  Removendo contas...');
      
      for (const account of patrimonioAccounts) {
        // Remover transações associadas
        await prisma.transaction.deleteMany({
          where: { accountId: account.id }
        });
        
        // Remover conta
        await prisma.account.delete({
          where: { id: account.id }
        });
        
        console.log(`✅ Removida conta: ${account.id}`);
      }
    }

    console.log('✅ Limpeza concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removePatrimonioLiquido();

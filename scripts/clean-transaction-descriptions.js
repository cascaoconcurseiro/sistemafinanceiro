const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDescriptions() {
  try {
    console.log('🧹 LIMPANDO DESCRIÇÕES DAS TRANSAÇÕES\n');
    
    // Buscar transações com IDs na descrição
    const transactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        description: {
          contains: 'cmhe'
        }
      },
      select: {
        id: true,
        description: true
      }
    });
    
    console.log(`📊 Transações encontradas: ${transactions.length}\n`);
    
    if (transactions.length === 0) {
      console.log('✅ Nenhuma transação com ID na descrição!');
      return;
    }
    
    let cleaned = 0;
    
    for (const transaction of transactions) {
      // Remover padrão (cmhe...) da descrição
      const cleanDescription = transaction.description
        .replace(/\s*\(cmh[a-z0-9]+\)/gi, '') // Remove (cmhe46m4t003pxv7a1u88vf3e)
        .replace(/\s*\(para\s+[^)]+\)/gi, '') // Remove (para Fran)
        .replace(/💸\s*Pagamento\s*-\s*/gi, 'Pagamento - ') // Limpa emoji duplicado
        .replace(/💰\s*Recebimento\s*-\s*/gi, 'Recebimento - ') // Limpa emoji duplicado
        .trim();
      
      console.log(`📝 Limpando:`);
      console.log(`   Antes: ${transaction.description}`);
      console.log(`   Depois: ${cleanDescription}\n`);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { description: cleanDescription }
      });
      
      cleaned++;
    }
    
    console.log(`✅ ${cleaned} descrições limpas!`);
    console.log('\n💡 Recarregue a página para ver as mudanças\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDescriptions();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTransaction() {
  try {
    // Buscar a transação "iii"
    const transaction = await prisma.transaction.findFirst({
      where: { description: 'iii' }
    });
    
    if (!transaction) {
      console.log('❌ Transação "iii" não encontrada');
      return;
    }
    
    console.log('Transação encontrada:', {
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      isShared: transaction.isShared
    });
    
    // Buscar membro da família (Wesley)
    const member = await prisma.familyMember.findFirst({
      where: { name: { contains: 'Wesley' } }
    });
    
    if (!member) {
      console.log('❌ Membro não encontrado');
      return;
    }
    
    console.log('Membro encontrado:', member.name, member.id);
    
    // Atualizar transação
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        isShared: true,
        sharedWith: JSON.stringify([member.id]),
        paidBy: member.id,
        metadata: JSON.stringify({ paidByName: member.name })
      }
    });
    
    console.log('✅ Transação atualizada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTransaction();

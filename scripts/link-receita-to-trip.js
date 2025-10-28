/**
 * Script para vincular a receita "Recebimento - carro (Wesley)" à viagem
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkReceitaToTrip() {
  try {
    const tripId = 'cmh9gqmrv001da7eq2h4lqf77';
    
    console.log('🔍 Buscando receita "Recebimento - carro (Wesley)"...\n');
    
    // Buscar a transação de receita
    const receita = await prisma.transaction.findFirst({
      where: {
        description: {
          contains: 'Recebimento - carro'
        },
        type: 'RECEITA',
        amount: 99.5
      }
    });

    if (!receita) {
      console.error('❌ Receita não encontrada!');
      
      // Buscar todas as receitas do período
      console.log('\n🔍 Buscando todas as receitas do período...');
      const receitas = await prisma.transaction.findMany({
        where: {
          type: 'RECEITA',
          date: {
            gte: new Date('2025-10-26'),
            lte: new Date('2025-10-28')
          }
        }
      });

      console.log(`\nEncontradas ${receitas.length} receitas:\n`);
      receitas.forEach(r => {
        console.log(`- ${r.description}: R$ ${r.amount} (ID: ${r.id})`);
      });
      
      return;
    }

    console.log('✅ Receita encontrada:');
    console.log(`   ID: ${receita.id}`);
    console.log(`   Descrição: ${receita.description}`);
    console.log(`   Valor: R$ ${receita.amount}`);
    console.log(`   Data: ${receita.date.toLocaleDateString('pt-BR')}`);
    console.log(`   Trip ID atual: ${receita.tripId || 'Não vinculada'}`);

    if (receita.tripId === tripId) {
      console.log('\n✅ Receita já está vinculada à viagem!');
      return;
    }

    // Vincular à viagem
    await prisma.transaction.update({
      where: { id: receita.id },
      data: { tripId: tripId }
    });

    console.log('\n✅ Receita vinculada à viagem com sucesso!');
    
    // Verificar total de transações vinculadas
    const allTransactions = await prisma.transaction.findMany({
      where: { tripId: tripId }
    });

    console.log(`\n📊 Total de transações vinculadas à viagem: ${allTransactions.length}`);
    allTransactions.forEach(t => {
      console.log(`   - ${t.description} (${t.type}): R$ ${t.amount}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkReceitaToTrip();

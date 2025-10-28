/**
 * Script para vincular transações à viagem automaticamente
 * Execute: node scripts/link-transactions-to-trip.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkTransactionsToTrip() {
  try {
    console.log('🔍 Buscando viagem...');
    
    // Buscar a viagem pelo ID
    const tripId = 'cmh9gqmrv001da7eq2h4lqf77';
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      console.error('❌ Viagem não encontrada!');
      return;
    }

    console.log('✅ Viagem encontrada:', trip.name);
    console.log('📅 Período:', trip.startDate, '-', trip.endDate);

    // Buscar transações sem tripId no período da viagem
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        tripId: null,
        type: 'DESPESA',
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    console.log(`📊 Encontradas ${transactions.length} transações para vincular`);

    if (transactions.length === 0) {
      console.log('ℹ️ Nenhuma transação encontrada no período');
      return;
    }

    // Mostrar transações encontradas
    transactions.forEach(t => {
      console.log(`  - ${t.description}: R$ ${t.amount} (${t.date.toLocaleDateString('pt-BR')})`);
    });

    // Vincular transações
    const result = await prisma.transaction.updateMany({
      where: {
        id: {
          in: transactions.map(t => t.id)
        }
      },
      data: {
        tripId: trip.id
      }
    });

    console.log(`✅ ${result.count} transações vinculadas com sucesso!`);

    // Calcular total gasto
    const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    // Atualizar campo spent da viagem
    await prisma.trip.update({
      where: { id: trip.id },
      data: { spent: totalSpent }
    });

    console.log(`💰 Total gasto atualizado: R$ ${totalSpent.toFixed(2)}`);
    console.log('🎉 Concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkTransactionsToTrip();

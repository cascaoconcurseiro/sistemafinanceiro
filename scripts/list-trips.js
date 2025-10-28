const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTrips() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total de viagens: ${trips.length}\n`);

    trips.forEach(trip => {
      console.log(`ID: ${trip.id}`);
      console.log(`Nome: ${trip.name}`);
      console.log(`Destino: ${trip.destination}`);
      console.log(`Período: ${trip.startDate.toLocaleDateString('pt-BR')} - ${trip.endDate.toLocaleDateString('pt-BR')}`);
      console.log(`Orçamento: R$ ${trip.budget}`);
      console.log(`Gasto: R$ ${trip.spent}`);
      console.log(`Status: ${trip.status}`);
      console.log('---\n');
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTrips();

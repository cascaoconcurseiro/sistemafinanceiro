const fetch = require('node-fetch');

async function testTripsAPI() {
  try {
    console.log('🔍 Buscando todas as viagens...');
    
    const response = await fetch('http://localhost:3001/api/trips');
    const trips = await response.json();
    
    console.log('\n📊 Viagens encontradas:');
    console.log('Total:', trips.length);
    
    trips.forEach((trip, index) => {
      console.log(`\n--- Viagem ${index + 1} ---`);
      console.log('ID:', trip.id);
      console.log('Nome:', trip.name);
      console.log('Destino:', trip.destination);
      console.log('Data Início:', trip.startDate);
      console.log('Data Fim:', trip.endDate);
      console.log('Orçamento:', trip.budget);
      console.log('Status:', trip.status);
      
      // Calcular dias usando a mesma lógica do getTripDuration
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('❌ Dias: Erro - datas inválidas');
      } else {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        console.log('📅 Dias calculados:', diffDays);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar viagens:', error);
  }
}

testTripsAPI();
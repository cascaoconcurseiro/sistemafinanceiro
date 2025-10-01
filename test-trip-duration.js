// Teste da função getTripDuration
function getTripDuration(startDate, endDate) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Data início:', startDate, '-> Date object:', start);
    console.log('Data fim:', endDate, '-> Date object:', end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('Datas inválidas');
      return 0;
    }
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    console.log('Diferença em ms:', diffTime);
    console.log('Diferença em dias (sem +1):', Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    console.log('Diferença em dias (com +1):', diffDays);
    
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('Erro ao calcular duração da viagem:', error);
    return 0;
  }
}

console.log('=== Testando função getTripDuration ===');

// Testar com diferentes formatos de data
console.log('\n--- Teste 1: Mesmo dia ---');
const result1 = getTripDuration('2024-01-15', '2024-01-15');
console.log('Resultado:', result1, 'dias');

console.log('\n--- Teste 2: Dois dias consecutivos ---');
const result2 = getTripDuration('2024-01-15', '2024-01-16');
console.log('Resultado:', result2, 'dias');

console.log('\n--- Teste 3: Uma semana ---');
const result3 = getTripDuration('2024-01-15', '2024-01-21');
console.log('Resultado:', result3, 'dias');

console.log('\n--- Teste 4: Formato brasileiro ---');
const result4 = getTripDuration('15/01/2024', '21/01/2024');
console.log('Resultado:', result4, 'dias');

console.log('\n--- Teste 5: Formato ISO com horário ---');
const result5 = getTripDuration('2024-01-15T00:00:00', '2024-01-21T23:59:59');
console.log('Resultado:', result5, 'dias');
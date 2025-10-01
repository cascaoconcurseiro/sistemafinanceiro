/**
 * Teste do Formulário de Viagem - SuaGrana
 * Verifica funcionalidades de cálculo de dias e criação de viagens
 */

console.log('🧪 TESTE DO FORMULÁRIO DE VIAGEM - SUAGRANA');
console.log('=' .repeat(60));

// Simulação das funções de data-utils
function validateBRDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);
  
  if (!match) return false;
  
  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.getDate() == parseInt(day) &&
         date.getMonth() == parseInt(month) - 1 &&
         date.getFullYear() == parseInt(year);
}

function convertBRDateToISO(brDate) {
  if (!validateBRDate(brDate)) return '';
  
  const [day, month, year] = brDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Simulação da função getDuration
function getDuration(startDate, endDate) {
  if (!startDate || !endDate || !validateBRDate(startDate) || !validateBRDate(endDate)) {
    return '';
  }
  
  try {
    const startISO = convertBRDateToISO(startDate);
    const endISO = convertBRDateToISO(endDate);
    const start = new Date(startISO);
    const end = new Date(endISO);
    
    // Adiciona 1 para incluir o dia final no cálculo
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? `${days} dia${days > 1 ? 's' : ''}` : '';
  } catch {
    return '';
  }
}

// Testes de validação de data
console.log('\n📅 TESTE 1: Validação de Datas');
console.log('-'.repeat(40));

const testDates = [
  '15/12/2024',
  '31/02/2024', // Data inválida
  '29/02/2024', // Ano bissexto
  '29/02/2023', // Não bissexto
  '01/01/2024',
  '32/01/2024', // Dia inválido
  '15/13/2024', // Mês inválido
  '',
  null,
  undefined
];

testDates.forEach(date => {
  const isValid = validateBRDate(date);
  console.log(`Data: ${date || 'null/undefined'} - Válida: ${isValid ? '✅' : '❌'}`);
});

// Testes de conversão de data
console.log('\n🔄 TESTE 2: Conversão de Datas');
console.log('-'.repeat(40));

const validDates = ['15/12/2024', '01/01/2024', '29/02/2024'];
validDates.forEach(date => {
  const iso = convertBRDateToISO(date);
  console.log(`BR: ${date} → ISO: ${iso}`);
});

// Testes de cálculo de duração
console.log('\n⏱️ TESTE 3: Cálculo de Duração');
console.log('-'.repeat(40));

const durationTests = [
  { start: '15/12/2024', end: '18/12/2024', expected: '4 dias' },
  { start: '15/12/2024', end: '15/12/2024', expected: '1 dia' },
  { start: '15/12/2024', end: '16/12/2024', expected: '2 dias' },
  { start: '31/12/2024', end: '02/01/2025', expected: '3 dias' },
  { start: '18/12/2024', end: '15/12/2024', expected: '' }, // Data fim antes do início
  { start: '15/12/2024', end: '32/12/2024', expected: '' }, // Data inválida
  { start: '', end: '15/12/2024', expected: '' },
  { start: '15/12/2024', end: '', expected: '' }
];

durationTests.forEach(test => {
  const result = getDuration(test.start, test.end);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${test.start} → ${test.end}: ${result || 'vazio'} ${status}`);
  if (result !== test.expected) {
    console.log(`  Esperado: "${test.expected}", Obtido: "${result}"`);
  }
});

// Teste de dados de viagem
console.log('\n🧳 TESTE 4: Validação de Dados de Viagem');
console.log('-'.repeat(40));

const tripData = {
  name: 'Viagem de Teste',
  destination: 'São Paulo, SP',
  startDate: '15/12/2024',
  endDate: '18/12/2024',
  budget: '2500.00',
  currency: 'BRL',
  participants: ['João Silva', 'Maria Santos'],
  description: 'Viagem de negócios'
};

console.log('Dados da viagem:');
console.log(`Nome: ${tripData.name}`);
console.log(`Destino: ${tripData.destination}`);
console.log(`Data início: ${tripData.startDate} (Válida: ${validateBRDate(tripData.startDate) ? '✅' : '❌'})`);
console.log(`Data fim: ${tripData.endDate} (Válida: ${validateBRDate(tripData.endDate) ? '✅' : '❌'})`);
console.log(`Duração: ${getDuration(tripData.startDate, tripData.endDate)}`);
console.log(`Orçamento: R$ ${tripData.budget}`);
console.log(`Moeda: ${tripData.currency}`);
console.log(`Participantes: ${tripData.participants.length} pessoa(s)`);
console.log(`Descrição: ${tripData.description}`);

// Teste de conversão para API
console.log('\n🔗 TESTE 5: Preparação para API');
console.log('-'.repeat(40));

try {
  const startISO = convertBRDateToISO(tripData.startDate);
  const endISO = convertBRDateToISO(tripData.endDate);
  const budget = parseFloat(tripData.budget);
  
  const apiData = {
    name: tripData.name.trim(),
    destination: tripData.destination.trim(),
    startDate: startISO,
    endDate: endISO,
    budget: budget,
    currency: tripData.currency.trim(),
    participants: tripData.participants,
    description: tripData.description?.trim() || '',
    status: 'planned',
    spent: 0,
    id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  console.log('Dados preparados para API:');
  console.log(JSON.stringify(apiData, null, 2));
  
  // Validações finais
  console.log('\n✅ VALIDAÇÕES FINAIS:');
  console.log(`Nome válido: ${apiData.name.length > 0 ? '✅' : '❌'}`);
  console.log(`Destino válido: ${apiData.destination.length > 0 ? '✅' : '❌'}`);
  console.log(`Data início válida: ${apiData.startDate.length > 0 ? '✅' : '❌'}`);
  console.log(`Data fim válida: ${apiData.endDate.length > 0 ? '✅' : '❌'}`);
  console.log(`Orçamento válido: ${!isNaN(apiData.budget) && apiData.budget > 0 ? '✅' : '❌'}`);
  console.log(`Participantes válidos: ${Array.isArray(apiData.participants) ? '✅' : '❌'}`);
  
} catch (error) {
  console.error('❌ Erro na preparação para API:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🎯 TESTE CONCLUÍDO - Formulário de Viagem');
// Script para testar o bug exato do trip-modal.tsx
// Reproduzindo EXATAMENTE a lógica usada no código real

// Função convertBRDateToISO exatamente como no código
function convertBRDateToISO(brDate) {
  if (!brDate || typeof brDate !== 'string') return '';
  
  const parts = brDate.split('/');
  if (parts.length !== 3) return '';
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  // Validação básica
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return '';
  }
  
  // Formato ISO: YYYY-MM-DD
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Função calculateDays EXATAMENTE como no trip-modal.tsx
function calculateDays(startDate, endDate) {
  const start = startDate;
  const end = endDate;
  
  if (!start || !end) {
    return 0;
  }
  
  try {
    const startISO = convertBRDateToISO(start);
    const endISO = convertBRDateToISO(end);
    
    if (!startISO || !endISO) {
      return 0;
    }
    
    const startDateObj = new Date(startISO);
    const endDateObj = new Date(endISO);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return 0;
    }
    
    // Calcular diferença em dias (incluindo o dia de início) - EXATAMENTE como no código
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Retornar pelo menos 1 dia se as datas são válidas e a data final é >= data inicial
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('Erro ao calcular dias:', error);
    return 0;
  }
}

// Testes específicos para o bug reportado
console.log('=== TESTE DO BUG REAL DO TRIP-MODAL ===\n');

// Teste 1: Datas em 2025 (problema reportado)
console.log('TESTE 1 - Datas em 2025:');
const start2025 = '01/01/2025';
const end2025 = '05/01/2025';
const days2025 = calculateDays(start2025, end2025);
console.log(`${start2025} até ${end2025} = ${days2025} dias`);
console.log(`Esperado: 5 dias (incluindo início), Obtido: ${days2025} dias`);
console.log(`Status: ${days2025 === 5 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 2: Datas em 2026 (funciona segundo o usuário)
console.log('TESTE 2 - Datas em 2026:');
const start2026 = '01/01/2026';
const end2026 = '05/01/2026';
const days2026 = calculateDays(start2026, end2026);
console.log(`${start2026} até ${end2026} = ${days2026} dias`);
console.log(`Esperado: 5 dias (incluindo início), Obtido: ${days2026} dias`);
console.log(`Status: ${days2026 === 5 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 3: Outras datas em 2025
console.log('TESTE 3 - Outras datas em 2025:');
const start2025b = '15/03/2025';
const end2025b = '20/03/2025';
const days2025b = calculateDays(start2025b, end2025b);
console.log(`${start2025b} até ${end2025b} = ${days2025b} dias`);
console.log(`Esperado: 6 dias (incluindo início), Obtido: ${days2025b} dias`);
console.log(`Status: ${days2025b === 6 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 4: Debug detalhado das conversões
console.log('TESTE 4 - Debug detalhado:');
console.log(`${start2025} -> ISO: ${convertBRDateToISO(start2025)}`);
console.log(`${end2025} -> ISO: ${convertBRDateToISO(end2025)}`);

const startDateObj2025 = new Date(convertBRDateToISO(start2025));
const endDateObj2025 = new Date(convertBRDateToISO(end2025));

console.log(`Data início 2025: ${startDateObj2025}`);
console.log(`Data fim 2025: ${endDateObj2025}`);
console.log(`getTime() início 2025: ${startDateObj2025.getTime()}`);
console.log(`getTime() fim 2025: ${endDateObj2025.getTime()}`);

const diffTime2025 = endDateObj2025.getTime() - startDateObj2025.getTime();
console.log(`Diferença em ms: ${diffTime2025}`);
console.log(`Diferença em dias (sem +1): ${Math.floor(diffTime2025 / (1000 * 60 * 60 * 24))}`);
console.log(`Diferença em dias (com +1): ${Math.floor(diffTime2025 / (1000 * 60 * 60 * 24)) + 1}\n`);

// Teste 5: Mesmo debug para 2026
console.log('TESTE 5 - Debug 2026:');
console.log(`${start2026} -> ISO: ${convertBRDateToISO(start2026)}`);
console.log(`${end2026} -> ISO: ${convertBRDateToISO(end2026)}`);

const startDateObj2026 = new Date(convertBRDateToISO(start2026));
const endDateObj2026 = new Date(convertBRDateToISO(end2026));

console.log(`Data início 2026: ${startDateObj2026}`);
console.log(`Data fim 2026: ${endDateObj2026}`);
console.log(`getTime() início 2026: ${startDateObj2026.getTime()}`);
console.log(`getTime() fim 2026: ${endDateObj2026.getTime()}`);

const diffTime2026 = endDateObj2026.getTime() - startDateObj2026.getTime();
console.log(`Diferença em ms: ${diffTime2026}`);
console.log(`Diferença em dias (sem +1): ${Math.floor(diffTime2026 / (1000 * 60 * 60 * 24))}`);
console.log(`Diferença em dias (com +1): ${Math.floor(diffTime2026 / (1000 * 60 * 60 * 24)) + 1}\n`);

// Teste 6: Verificar se há diferença de fuso horário
console.log('TESTE 6 - Verificação de fuso horário:');
console.log(`Timezone offset 2025: ${startDateObj2025.getTimezoneOffset()}`);
console.log(`Timezone offset 2026: ${startDateObj2026.getTimezoneOffset()}`);

// Teste 7: Teste com datas atuais
console.log('\nTESTE 7 - Datas atuais:');
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const todayBR = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
const tomorrowBR = `${tomorrow.getDate().toString().padStart(2, '0')}/${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}/${tomorrow.getFullYear()}`;

const daysToday = calculateDays(todayBR, tomorrowBR);
console.log(`${todayBR} até ${tomorrowBR} = ${daysToday} dias`);
console.log(`Esperado: 2 dias, Obtido: ${daysToday} dias`);
console.log(`Status: ${daysToday === 2 ? 'PASSOU' : 'FALHOU'}`);

console.log('\n=== FIM DOS TESTES ===');
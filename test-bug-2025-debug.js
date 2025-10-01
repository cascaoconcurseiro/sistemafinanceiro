// Script para testar o bug de cálculo de dias entre 2025 e 2026
// Reproduzindo exatamente as funções usadas no trip-modal.tsx

const { format, parse, differenceInDays } = require('date-fns');

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

// Função calculateDays exatamente como no código
function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  
  try {
    // Converte as datas BR para ISO
    const startISO = convertBRDateToISO(startDate);
    const endISO = convertBRDateToISO(endDate);
    
    if (!startISO || !endISO) return 0;
    
    // Cria objetos Date
    const start = new Date(startISO);
    const end = new Date(endISO);
    
    // Calcula a diferença em dias
    const days = differenceInDays(end, start);
    
    return Math.max(0, days);
  } catch (error) {
    console.error('Erro ao calcular dias:', error);
    return 0;
  }
}

// Testes específicos para o bug reportado
console.log('=== TESTE DO BUG DE CÁLCULO DE DIAS ===\n');

// Teste 1: Datas em 2025 (problema reportado)
console.log('TESTE 1 - Datas em 2025:');
const start2025 = '01/01/2025';
const end2025 = '05/01/2025';
const days2025 = calculateDays(start2025, end2025);
console.log(`${start2025} até ${end2025} = ${days2025} dias`);
console.log(`Esperado: 4 dias, Obtido: ${days2025} dias`);
console.log(`Status: ${days2025 === 4 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 2: Datas em 2026 (funciona segundo o usuário)
console.log('TESTE 2 - Datas em 2026:');
const start2026 = '01/01/2026';
const end2026 = '05/01/2026';
const days2026 = calculateDays(start2026, end2026);
console.log(`${start2026} até ${end2026} = ${days2026} dias`);
console.log(`Esperado: 4 dias, Obtido: ${days2026} dias`);
console.log(`Status: ${days2026 === 4 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 3: Outras datas em 2025
console.log('TESTE 3 - Outras datas em 2025:');
const start2025b = '15/03/2025';
const end2025b = '20/03/2025';
const days2025b = calculateDays(start2025b, end2025b);
console.log(`${start2025b} até ${end2025b} = ${days2025b} dias`);
console.log(`Esperado: 5 dias, Obtido: ${days2025b} dias`);
console.log(`Status: ${days2025b === 5 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 4: Datas atuais (2024/2025)
console.log('TESTE 4 - Datas atuais:');
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
const currentDay = currentDate.getDate().toString().padStart(2, '0');
const todayBR = `${currentDay}/${currentMonth}/${currentYear}`;

const nextWeek = new Date(currentDate);
nextWeek.setDate(currentDate.getDate() + 7);
const nextWeekBR = `${nextWeek.getDate().toString().padStart(2, '0')}/${(nextWeek.getMonth() + 1).toString().padStart(2, '0')}/${nextWeek.getFullYear()}`;

const daysCurrent = calculateDays(todayBR, nextWeekBR);
console.log(`${todayBR} até ${nextWeekBR} = ${daysCurrent} dias`);
console.log(`Esperado: 7 dias, Obtido: ${daysCurrent} dias`);
console.log(`Status: ${daysCurrent === 7 ? 'PASSOU' : 'FALHOU'}\n`);

// Teste 5: Debug das conversões ISO
console.log('TESTE 5 - Debug das conversões ISO:');
console.log(`${start2025} -> ISO: ${convertBRDateToISO(start2025)}`);
console.log(`${end2025} -> ISO: ${convertBRDateToISO(end2025)}`);
console.log(`${start2026} -> ISO: ${convertBRDateToISO(start2026)}`);
console.log(`${end2026} -> ISO: ${convertBRDateToISO(end2026)}\n`);

// Teste 6: Debug dos objetos Date
console.log('TESTE 6 - Debug dos objetos Date:');
const startDate2025 = new Date(convertBRDateToISO(start2025));
const endDate2025 = new Date(convertBRDateToISO(end2025));
const startDate2026 = new Date(convertBRDateToISO(start2026));
const endDate2026 = new Date(convertBRDateToISO(end2026));

console.log(`Data início 2025: ${startDate2025}`);
console.log(`Data fim 2025: ${endDate2025}`);
console.log(`Data início 2026: ${startDate2026}`);
console.log(`Data fim 2026: ${endDate2026}\n`);

// Teste 7: Diferença em milissegundos
console.log('TESTE 7 - Diferença em milissegundos:');
const diff2025ms = endDate2025.getTime() - startDate2025.getTime();
const diff2026ms = endDate2026.getTime() - startDate2026.getTime();
console.log(`Diferença 2025 (ms): ${diff2025ms}`);
console.log(`Diferença 2026 (ms): ${diff2026ms}`);
console.log(`Diferença 2025 (dias): ${diff2025ms / (1000 * 60 * 60 * 24)}`);
console.log(`Diferença 2026 (dias): ${diff2026ms / (1000 * 60 * 60 * 24)}\n`);

console.log('=== FIM DOS TESTES ===');
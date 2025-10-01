// Teste usando a implementação real com date-fns
const { format, parse, isValid } = require('date-fns');

function convertBRDateToISO(brDate) {
  try {
    const parsed = parse(brDate, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed)) return '';
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }
  
  try {
    const startISO = convertBRDateToISO(startDate);
    const endISO = convertBRDateToISO(endDate);
    
    console.log(`Testando: ${startDate} -> ${startISO}, ${endDate} -> ${endISO}`);
    
    if (!startISO || !endISO) {
      console.log('Erro na conversão para ISO');
      return 0;
    }
    
    const startDateObj = new Date(startISO);
    const endDateObj = new Date(endISO);
    
    console.log(`Objetos Date: ${startDateObj}, ${endDateObj}`);
    console.log(`Timestamps: ${startDateObj.getTime()}, ${endDateObj.getTime()}`);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.log('Datas inválidas após conversão');
      return 0;
    }
    
    // Calcular diferença em dias (incluindo o dia de início)
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    console.log(`Diferença em tempo: ${diffTime}, Diferença em dias: ${diffDays}`);
    
    // Retornar pelo menos 1 dia se as datas são válidas e a data final é >= data inicial
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('Erro ao calcular dias:', error);
    return 0;
  }
}

// Testes específicos para o problema relatado
console.log('=== TESTE COM DATE-FNS ===');

console.log('\n=== TESTE 1: Dia 01 de 2025 ===');
console.log('Resultado:', calculateDays('01/01/2025', '05/01/2025'));

console.log('\n=== TESTE 2: Dia 01 de 2026 ===');
console.log('Resultado:', calculateDays('01/01/2026', '05/01/2026'));

console.log('\n=== TESTE 3: Outros dias de 2025 ===');
console.log('Resultado:', calculateDays('15/03/2025', '20/03/2025'));

console.log('\n=== TESTE 4: Outros dias de 2026 ===');
console.log('Resultado:', calculateDays('15/03/2026', '20/03/2026'));

console.log('\n=== TESTE 5: Problema específico - Janeiro 2025 vs 2026 ===');
console.log('2025 - 01/01 a 31/01:', calculateDays('01/01/2025', '31/01/2025'));
console.log('2026 - 01/01 a 31/01:', calculateDays('01/01/2026', '31/01/2026'));

console.log('\n=== TESTE 6: Datas atuais ===');
const hoje = new Date();
const amanha = new Date(hoje);
amanha.setDate(hoje.getDate() + 4);

const hojeStr = hoje.toLocaleDateString('pt-BR');
const amanhaStr = amanha.toLocaleDateString('pt-BR');

console.log(`Hoje: ${hojeStr}, Daqui a 4 dias: ${amanhaStr}`);
console.log('Resultado:', calculateDays(hojeStr, amanhaStr));
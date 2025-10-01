// Teste para debugar o problema de cálculo de dias
// Simulando as funções usadas no trip-modal.tsx

function convertBRDateToISO(brDate) {
  if (!brDate) return '';

  const parts = brDate.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;

  // Validar se são números válidos
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return '';
  if (dayNum < 1 || dayNum > 31) return '';
  if (monthNum < 1 || monthNum > 12) return '';
  if (yearNum < 1900 || yearNum > 2100) return '';

  // Criar data e verificar se é válida (isso detecta datas como 31/02)
  const testDate = new Date(yearNum, monthNum - 1, dayNum);
  if (
    testDate.getFullYear() !== yearNum ||
    testDate.getMonth() !== monthNum - 1 ||
    testDate.getDate() !== dayNum
  ) {
    return '';
  }

  // Criar data no formato ISO apenas se a data for válida
  const isoDate = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  return isoDate;
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
console.log('=== TESTE 1: Dia 01 de 2025 ===');
console.log('Resultado:', calculateDays('01/01/2025', '05/01/2025'));

console.log('\n=== TESTE 2: Dia 01 de 2026 ===');
console.log('Resultado:', calculateDays('01/01/2026', '05/01/2026'));

console.log('\n=== TESTE 3: Outros dias de 2025 ===');
console.log('Resultado:', calculateDays('15/03/2025', '20/03/2025'));

console.log('\n=== TESTE 4: Outros dias de 2026 ===');
console.log('Resultado:', calculateDays('15/03/2026', '20/03/2026'));

console.log('\n=== TESTE 5: Data atual para frente ===');
const hoje = new Date();
const amanha = new Date(hoje);
amanha.setDate(hoje.getDate() + 1);

const hojeStr = hoje.toLocaleDateString('pt-BR');
const amanhaStr = amanha.toLocaleDateString('pt-BR');

console.log('Resultado:', calculateDays(hojeStr, amanhaStr));

console.log('\n=== TESTE 6: Problema específico - Janeiro 2025 vs 2026 ===');
console.log('2025 - 01/01 a 31/01:', calculateDays('01/01/2025', '31/01/2025'));
console.log('2026 - 01/01 a 31/01:', calculateDays('01/01/2026', '31/01/2026'));
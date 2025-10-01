// Script para adicionar logs de debug temporários no CategoryBudgetCard
// Este script vai modificar temporariamente o componente para adicionar logs

const fs = require('fs');
const path = require('path');

const componentPath = path.join(__dirname, 'src', 'components', 'cards', 'dashboard-sections.tsx');

// Ler o arquivo atual
const currentContent = fs.readFileSync(componentPath, 'utf8');

// Adicionar logs de debug no início da função CategoryBudgetCard
const debugLogs = `
  // DEBUG LOGS TEMPORÁRIOS
  console.log('🔍 CategoryBudgetCard renderizado');
  console.log('🔍 transactions:', transactions?.length || 0);
  console.log('🔍 loading:', loading);
  console.log('🔍 dashboardData:', dashboardData);
  console.log('🔍 categoryBreakdown:', dashboardData?.categoryBreakdown);
  console.log('🔍 totalExpenses:', dashboardData?.totalExpenses);
`;

// Encontrar a linha onde adicionar os logs (após a linha do useUnified)
const lines = currentContent.split('\n');
let modifiedContent = '';
let added = false;

for (let i = 0; i < lines.length; i++) {
  modifiedContent += lines[i] + '\n';
  
  // Adicionar logs após a linha do useUnified
  if (lines[i].includes('const { transactions, loading, dashboardData } = useUnified();') && !added) {
    modifiedContent += debugLogs + '\n';
    added = true;
  }
}

// Escrever o arquivo modificado
fs.writeFileSync(componentPath, modifiedContent);

console.log('✅ Logs de debug adicionados ao CategoryBudgetCard');
console.log('📍 Arquivo modificado:', componentPath);
console.log('🔄 Recarregue a página para ver os logs no console do navegador');
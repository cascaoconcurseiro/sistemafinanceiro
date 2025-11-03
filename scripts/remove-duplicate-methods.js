const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/services/financial-operations-service.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`📄 Total de linhas antes: ${lines.length}`);

// Linhas a remover (baseado na análise anterior)
// Vamos remover os métodos duplicados mantendo apenas a primeira ocorrência

// Encontrar onde cada método duplicado começa e termina
function findMethodEnd(startLine, lines) {
  let braceCount = 0;
  let inMethod = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    
    // Contar chaves
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        inMethod = true;
      } else if (char === '}') {
        braceCount--;
        if (inMethod && braceCount === 0) {
          return i;
        }
      }
    }
  }
  
  return -1;
}

// Métodos duplicados a remover (linha - 1 porque array é 0-indexed)
const duplicatesToRemove = [
  { name: 'linkTransactionToInvoice', start: 825 },
  { name: 'updateCreditCardBalance', start: 907 },
  { name: 'validateCreditCardLimit', start: 939 },
  { name: 'updateAccountBalance', start: 1410 },
  { name: 'updateCreditCardBalance', start: 1453 },
  { name: 'createJournalEntriesForTransaction', start: 1506 },
];

// Marcar linhas para remoção
const linesToRemove = new Set();

duplicatesToRemove.forEach(dup => {
  const startIdx = dup.start - 1; // Converter para 0-indexed
  const endIdx = findMethodEnd(startIdx, lines);
  
  if (endIdx !== -1) {
    console.log(`🗑️  Removendo ${dup.name} (linhas ${dup.start}-${endIdx + 1})`);
    for (let i = startIdx; i <= endIdx; i++) {
      linesToRemove.add(i);
    }
  } else {
    console.log(`⚠️  Não foi possível encontrar o fim de ${dup.name}`);
  }
});

// Criar novo conteúdo sem as linhas duplicadas
const cleanLines = lines.filter((_, index) => !linesToRemove.has(index));

console.log(`📄 Total de linhas depois: ${cleanLines.length}`);
console.log(`🗑️  Linhas removidas: ${linesToRemove.size}`);

// Salvar arquivo limpo
fs.writeFileSync(filePath, cleanLines.join('\n'), 'utf8');

console.log(`✅ Arquivo limpo salvo!`);

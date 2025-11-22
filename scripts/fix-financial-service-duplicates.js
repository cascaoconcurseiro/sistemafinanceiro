const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/services/financial-operations-service.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`📄 Total de linhas: ${lines.length}`);

// Encontrar métodos duplicados
const methodSignatures = {};
const duplicateLines = [];

lines.forEach((line, index) => {
  const match = line.match(/(private\s+)?static\s+async\s+(\w+)\s*\(/);
  if (match) {
    const methodName = match[2];
    if (methodSignatures[methodName]) {
      console.log(`❌ Método duplicado encontrado: ${methodName} na linha ${index + 1}`);
      console.log(`   Primeira ocorrência: linha ${methodSignatures[methodName]}`);
      duplicateLines.push(index + 1);
    } else {
      methodSignatures[methodName] = index + 1;
      console.log(`✅ Método ${methodName} na linha ${index + 1}`);
    }
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   Métodos únicos: ${Object.keys(methodSignatures).length}`);
console.log(`   Duplicações encontradas: ${duplicateLines.length}`);

if (duplicateLines.length > 0) {
  console.log(`\n⚠️  Linhas com duplicações: ${duplicateLines.join(', ')}`);
}

const fs = require('fs');
const path = require('path');

// Lista de todas as APIs
const apis = [
  '/api/itinerary',
  '/api/itinerary-simple',
  '/api/contacts',
  '/api/theme-settings',
  '/api/user/appearance',
  '/api/shopping-items',
  '/api/recent-searches',
  '/api/reconciliation',
  '/api/recurring-transactions',
  '/api/scheduled-transactions',
  '/api/ml/alerts',
  '/api/ml/categorize',
  '/api/ml/predict-spending',
  '/api/ml/savings-suggestions',
];

// Função para procurar uso de uma API
function searchApiUsage(apiPath) {
  const srcDir = path.join(__dirname, '../src');
  let found = false;
  
  function searchInDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchInDir(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(apiPath)) {
          console.log(`  ✅ Usado em: ${fullPath.replace(srcDir, 'src')}`);
          found = true;
        }
      }
    }
  }
  
  searchInDir(srcDir);
  return found;
}

console.log('🔍 Analisando uso de APIs...\n');

const unused = [];
const used = [];

for (const api of apis) {
  console.log(`\n📍 Verificando: ${api}`);
  const isUsed = searchApiUsage(api);
  
  if (!isUsed) {
    console.log(`  ❌ NÃO USADO`);
    unused.push(api);
  } else {
    used.push(api);
  }
}

console.log('\n\n📊 RESUMO:');
console.log(`\n✅ APIs em uso: ${used.length}`);
used.forEach(api => console.log(`  - ${api}`));

console.log(`\n❌ APIs não usadas: ${unused.length}`);
unused.forEach(api => console.log(`  - ${api}`));

// Salvar relatório
const report = {
  date: new Date().toISOString(),
  used,
  unused,
  total: apis.length
};

fs.writeFileSync(
  path.join(__dirname, '../docs/APIS-NAO-USADAS.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Relatório salvo em: docs/APIS-NAO-USADAS.json');

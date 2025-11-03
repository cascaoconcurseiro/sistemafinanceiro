/**
 * Refatoração Passo 1 - Remover Duplicações
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('🔧 REFATORAÇÃO PASSO 1 - REMOVENDO DUPLICAÇÕES\n');

let removed = 0;

function removeFolder(folderPath) {
  try {
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`✓ Removido: ${path.relative(rootDir, folderPath)}`);
      removed++;
      return true;
    }
  } catch (error) {
    console.log(`✗ Erro: ${path.relative(rootDir, folderPath)}`);
    return false;
  }
}

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Removido: ${path.relative(rootDir, filePath)}`);
      removed++;
      return true;
    }
  } catch (error) {
    console.log(`✗ Erro: ${path.relative(rootDir, filePath)}`);
    return false;
  }
}

console.log('1️⃣ REMOVENDO PROVIDERS DUPLICADO\n');
// Manter src/components/providers, remover src/providers
removeFolder(path.join(rootDir, 'src/providers'));

console.log('\n2️⃣ REMOVENDO UTILS DUPLICADO\n');
// Manter src/lib/utils, remover src/utils
removeFolder(path.join(rootDir, 'src/utils'));

console.log('\n3️⃣ REMOVENDO MIDDLEWARE DUPLICADO\n');
// Manter src/middleware.ts, remover pasta src/middleware
removeFolder(path.join(rootDir, 'src/middleware'));

console.log('\n4️⃣ REMOVENDO PASTAS VAZIAS/DESNECESSÁRIAS\n');
removeFolder(path.join(rootDir, 'src/financial'));
removeFolder(path.join(rootDir, 'src/__mocks__'));

console.log('\n5️⃣ REMOVENDO PÁGINAS DUPLICADAS\n');
// Manter accounts-manager, remover accounts
removeFolder(path.join(rootDir, 'src/app/accounts'));

// Manter shared, remover shared-debts
removeFolder(path.join(rootDir, 'src/app/shared-debts'));

// Manter travel, remover trips
removeFolder(path.join(rootDir, 'src/app/trips'));

console.log('\n6️⃣ REMOVENDO PÁGINAS NÃO USADAS\n');
const unusedPages = [
  'src/app/(authenticated)',
  'src/app/budget',
  'src/app/cards',
  'src/app/dashboard/intelligence',
  'src/app/diagnostico',
  'src/app/financial-settings',
  'src/app/fix-card-limit',
  'src/app/setup-categories',
  'src/app/transfers',
];

unusedPages.forEach(page => {
  removeFolder(path.join(rootDir, page));
});

console.log('\n7️⃣ REMOVENDO COMPONENTES NÃO USADOS\n');
removeFolder(path.join(rootDir, 'src/components/dashboards'));
removeFolder(path.join(rootDir, 'src/components/investments'));
removeFolder(path.join(rootDir, 'src/components/management'));
removeFolder(path.join(rootDir, 'src/components/optimization'));
removeFolder(path.join(rootDir, 'src/components/accounting'));
removeFolder(path.join(rootDir, 'src/components/financial'));

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Passo 1 concluído!`);
console.log(`🗑️  Itens removidos: ${removed}`);
console.log('\n📝 Próximo passo: Organizar src/lib\n');

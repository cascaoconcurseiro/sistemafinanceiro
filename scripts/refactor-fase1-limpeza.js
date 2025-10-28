/**
 * FASE 1: Limpeza Rápida
 * Remove arquivos de debug, test e backups
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, '..');

const filesToDelete = [
  // Componentes de debug/test
  'src/components/debug-dashboard-data.tsx',
  'src/components/test-accounts-debug.tsx',
  'src/utils/test-notifications.ts',
  
  // Arquivos backup
  'src/components/shared-expenses-billing-backup.tsx',
  'scripts/test-security.ts.bak',
];

const dirsToDelete = [
  // Pastas de test/development
  'src/components/development',
  'src/components/test',
  'src/data',
];

console.log('🔄 FASE 1: Limpeza Rápida\n');

// Deletar arquivos
console.log('1️⃣ Deletando arquivos de debug/test/backup...');
let filesDeleted = 0;

filesToDelete.forEach(file => {
  const fullPath = path.join(PROJECT_DIR, file);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`   ✅ Deletado: ${file}`);
      filesDeleted++;
    } catch (error) {
      console.log(`   ❌ Erro ao deletar ${file}: ${error.message}`);
    }
  } else {
    console.log(`   ⏭️  Não encontrado: ${file}`);
  }
});

console.log(`   📊 ${filesDeleted} arquivos deletados\n`);

// Deletar diretórios
console.log('2️⃣ Deletando pastas de test/development...');
let dirsDeleted = 0;

dirsToDelete.forEach(dir => {
  const fullPath = path.join(PROJECT_DIR, dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`   ✅ Deletado: ${dir}/`);
      dirsDeleted++;
    } catch (error) {
      console.log(`   ❌ Erro ao deletar ${dir}: ${error.message}`);
    }
  } else {
    console.log(`   ⏭️  Não encontrado: ${dir}/`);
  }
});

console.log(`   📊 ${dirsDeleted} pastas deletadas\n`);

console.log('✅ FASE 1 CONCLUÍDA!');
console.log(`📊 Total: ${filesDeleted} arquivos + ${dirsDeleted} pastas deletados\n`);

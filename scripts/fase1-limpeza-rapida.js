/**
 * Fase 1: Limpeza Rápida
 * Remove código de debug, arquivos backup e pastas vazias
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, '..');

// Arquivos específicos para deletar
const FILES_TO_DELETE = [
  // Componentes de debug/test
  'src/components/debug-dashboard-data.tsx',
  'src/components/test-accounts-debug.tsx',
  'src/utils/test-notifications.ts',
  
  // Arquivos backup
  'src/components/shared-expenses-billing-backup.tsx',
  'scripts/test-security.ts.bak',
  
  // Outros arquivos desnecessários
  'src/components/shared-expenses-billing-new.tsx', // Se não for o atual
];

// Diretórios para deletar
const DIRS_TO_DELETE = [
  'src/data', // Vazio
  'src/components/development',
  'src/components/test',
];

function deleteFile(filePath) {
  const fullPath = path.join(PROJECT_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`✅ Deletado: ${filePath}`);
    return true;
  }
  return false;
}

function deleteDirectory(dirPath) {
  const fullPath = path.join(PROJECT_DIR, dirPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ Deletado: ${dirPath}/`);
    return true;
  }
  return false;
}

async function fase1() {
  console.log('🧹 Fase 1: Limpeza Rápida\n');
  
  let deletedFiles = 0;
  let deletedDirs = 0;
  
  // Deletar arquivos
  console.log('📄 Deletando arquivos...\n');
  for (const file of FILES_TO_DELETE) {
    if (deleteFile(file)) {
      deletedFiles++;
    }
  }
  
  // Deletar diretórios
  console.log('\n📁 Deletando diretórios...\n');
  for (const dir of DIRS_TO_DELETE) {
    if (deleteDirectory(dir)) {
      deletedDirs++;
    }
  }
  
  console.log('\n✅ Fase 1 concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   📄 Arquivos deletados: ${deletedFiles}`);
  console.log(`   📁 Diretórios deletados: ${deletedDirs}`);
  console.log('\n🎯 Limpeza rápida finalizada!');
}

fase1()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

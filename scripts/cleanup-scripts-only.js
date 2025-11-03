/**
 * Remove scripts desnecessários, mantendo apenas os essenciais
 */

const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);

console.log('🧹 LIMPANDO SCRIPTS DESNECESSÁRIOS\n');

// Scripts ESSENCIAIS que devem ser mantidos
const essentialScripts = [
  // Setup e inicialização
  'create-admin-user.js',
  'create-complete-categories.js',
  'setup-system.ts',
  'init-real-system.ts',
  
  // Manutenção do banco
  'backup-database.js',
  'reset-db-keep-admin.js',
  'reset-user-password.js',
  
  // Migrações
  'migrate-database.ts',
  'add-database-indexes.js',
  
  // Utilitários importantes
  'fix-common-issues.js',
  
  // Este script
  'cleanup-scripts-only.js',
];

let deleted = 0;

const allScripts = fs.readdirSync(scriptsDir)
  .filter(file => 
    (file.endsWith('.js') || file.endsWith('.ts')) && 
    !file.endsWith('.d.ts')
  );

console.log(`📊 Total de scripts: ${allScripts.length}`);
console.log(`✅ Scripts essenciais: ${essentialScripts.length}\n`);

console.log('🗑️  Removendo scripts não essenciais:\n');

allScripts.forEach(script => {
  if (!essentialScripts.includes(script)) {
    const scriptPath = path.join(scriptsDir, script);
    try {
      fs.unlinkSync(scriptPath);
      console.log(`   ✓ ${script}`);
      deleted++;
    } catch (error) {
      console.log(`   ✗ Erro ao deletar ${script}`);
    }
  }
});

// Remover pastas de scripts
const scriptFolders = ['database', 'maintenance', 'testing'];
scriptFolders.forEach(folder => {
  const folderPath = path.join(scriptsDir, folder);
  if (fs.existsSync(folderPath)) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`\n📁 Pasta removida: ${folder}`);
    } catch (error) {
      console.log(`\n❌ Erro ao remover pasta: ${folder}`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Limpeza concluída!`);
console.log(`🗑️  Scripts removidos: ${deleted}`);
console.log(`✅ Scripts mantidos: ${essentialScripts.length}`);

console.log('\n📋 Scripts essenciais mantidos:\n');
essentialScripts.forEach(script => {
  console.log(`   ✓ ${script}`);
});

console.log('\n');

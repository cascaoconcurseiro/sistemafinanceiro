const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Criando re-exportações baseadas no backup...\n');

const backupDir = path.join(__dirname, '..', '..', 'SuaGrana-BACKUP-v1.0-26-10-2025', 'src', 'components');
const cleanDir = path.join(__dirname, '..', 'src', 'components');

// Listar todos os .tsx do backup (raiz)
const backupFiles = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.tsx') && !f.includes('test') && !f.includes('backup'));

console.log(`📋 Encontrados ${backupFiles.length} componentes no backup\n`);

const created = [];
const skipped = [];
const errors = [];

backupFiles.forEach(file => {
  const componentName = file.replace('.tsx', '');
  const exportFile = path.join(cleanDir, `${componentName}.ts`);
  
  // Pular se já existe
  if (fs.existsSync(exportFile)) {
    skipped.push(componentName);
    return;
  }
  
  try {
    // Procurar o componente no Clean
    const searchCmd = `dir /s /b "${file}" 2>nul`;
    const result = execSync(searchCmd, {
      cwd: cleanDir,
      encoding: 'utf-8'
    }).trim();
    
    if (result) {
      const fullPath = result.split('\n')[0].trim();
      const relativePath = fullPath
        .replace(/\\/g, '/')
        .split('/src/components/')[1]
        .replace('.tsx', '');
      
      // Gerar nome do componente em PascalCase
      const pascalName = componentName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
      
      // Ler arquivo para detectar tipo de exportação
      const content = fs.readFileSync(fullPath.replace(/\//g, '\\'), 'utf-8');
      
      let exportContent;
      if (content.includes('export default')) {
        exportContent = `export { default as ${pascalName} } from './${relativePath}';\n`;
      } else if (content.match(/export \{[^}]*\}/)) {
        exportContent = `export * from './${relativePath}';\n`;
      } else {
        exportContent = `export { ${pascalName} } from './${relativePath}';\n`;
      }
      
      fs.writeFileSync(exportFile, exportContent);
      created.push({ name: componentName, path: relativePath });
    }
  } catch (error) {
    errors.push(componentName);
  }
});

console.log('✅ CRIADOS:\n');
created.forEach(({ name, path }) => {
  console.log(`   ✓ ${name}.ts → ${path}`);
});

if (skipped.length > 0) {
  console.log(`\n⏭️  JÁ EXISTIAM (${skipped.length}):`);
  console.log(`   ${skipped.slice(0, 10).join(', ')}${skipped.length > 10 ? '...' : ''}`);
}

if (errors.length > 0) {
  console.log(`\n❌ NÃO ENCONTRADOS (${errors.length}):`);
  errors.forEach(e => console.log(`   ✗ ${e}`));
}

console.log(`\n📊 RESUMO:`);
console.log(`   Criados: ${created.length}`);
console.log(`   Já existiam: ${skipped.length}`);
console.log(`   Não encontrados: ${errors.length}`);
console.log('\n✨ Concluído!\n');

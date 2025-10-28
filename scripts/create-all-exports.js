const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Criando TODAS as re-exportações necessárias...\n');

const componentsDir = path.join(__dirname, '..', 'src', 'components');

// Lista de componentes que precisam de re-exportação
const componentsToExport = [
  'advanced-pwa-settings',
  'shared-expense-modal',
  'add-transaction-modal',
  'trip-details'
];

const created = [];
const errors = [];

componentsToExport.forEach(comp => {
  try {
    console.log(`🔍 Procurando ${comp}...`);
    
    const result = execSync(`dir /s /b "${comp}.tsx" 2>nul`, {
      cwd: componentsDir,
      encoding: 'utf-8'
    }).trim();
    
    if (result) {
      const fullPath = result.split('\n')[0].trim();
      const relativePath = fullPath
        .replace(/\\/g, '/')
        .split('/src/components/')[1]
        .replace('.tsx', '');
      
      console.log(`   ✓ Encontrado: ${relativePath}`);
      
      // Ler conteúdo para detectar tipo de exportação
      // Usar caminho absoluto do Windows
      const absolutePath = fullPath.replace(/\//g, '\\');
      const content = fs.readFileSync(absolutePath, 'utf-8');
      
      // Detectar nome do componente
      const componentName = comp
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
      
      // Criar re-exportação
      const exportPath = path.join(componentsDir, `${comp}.ts`);
      let exportContent;
      
      if (content.includes('export default')) {
        exportContent = `export { default as ${componentName} } from './${relativePath}';\n`;
      } else if (content.match(/export \{[^}]*\}/)) {
        exportContent = `export * from './${relativePath}';\n`;
      } else {
        exportContent = `export { ${componentName} } from './${relativePath}';\n`;
      }
      
      fs.writeFileSync(exportPath, exportContent);
      console.log(`   ✅ Criado: ${comp}.ts\n`);
      created.push(comp);
    } else {
      console.log(`   ❌ Não encontrado\n`);
      errors.push(comp);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
    errors.push(comp);
  }
});

console.log('📊 RESUMO:');
console.log(`   ✅ Criados: ${created.length}`);
console.log(`   ❌ Erros: ${errors.length}\n`);

if (created.length > 0) {
  console.log('✅ Arquivos criados:');
  created.forEach(c => console.log(`   - ${c}.ts`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Não encontrados:');
  errors.forEach(c => console.log(`   - ${c}`));
  console.log('');
}

console.log('✨ Concluído!\n');

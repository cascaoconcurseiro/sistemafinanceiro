#!/usr/bin/env node

/**
 * Script para organizar documentação
 * Move arquivos .md para estrutura docs/
 */

const fs = require('fs');
const path = require('path');

console.log('📁 Organizando Documentação...\n');

// Criar estrutura de pastas
const docsStructure = {
  'docs/audits': [],
  'docs/development': [],
  'docs/architecture': [],
  'docs/deployment': [],
  'docs/user-guides': []
};

// Criar pastas
Object.keys(docsStructure).forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Criado: ${dir}/`);
  }
});

// Mapear arquivos para destinos
const fileMapping = {
  // Auditorias
  'ANALISE-': 'docs/audits',
  'AUDITORIA-': 'docs/audits',
  'RELATORIO-': 'docs/audits',
  
  // Desenvolvimento
  'GUIA-': 'docs/development',
  'EXECUTAR-': 'docs/development',
  'CONFIGURACAO-': 'docs/development',
  
  // Arquitetura
  'IMPLEMENTACAO-': 'docs/architecture',
  'SISTEMA-': 'docs/architecture',
  
  // Deploy
  'NETLIFY-': 'docs/deployment',
  'NEON-': 'docs/deployment',
  
  // Correções (manter na raiz por enquanto)
  'CORRECOES-': '.',
  'PROBLEMAS-': '.',
  'RESUMO-': '.',
  'PLANO-': '.',
  'RESPOSTA-': '.'
};

// Ler arquivos da raiz
const rootFiles = fs.readdirSync(process.cwd());
const mdFiles = rootFiles.filter(file => 
  file.endsWith('.md') && 
  !['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE.md'].includes(file)
);

let filesMoved = 0;
let filesSkipped = 0;

console.log(`\n📋 Processando ${mdFiles.length} arquivos...\n`);

mdFiles.forEach(file => {
  let targetDir = 'docs/'; // Default
  
  // Encontrar destino baseado no prefixo
  for (const [prefix, dir] of Object.entries(fileMapping)) {
    if (file.startsWith(prefix)) {
      targetDir = dir;
      break;
    }
  }
  
  // Se for manter na raiz, pular
  if (targetDir === '.') {
    console.log(`⏭️  Mantido na raiz: ${file}`);
    filesSkipped++;
    return;
  }
  
  const sourcePath = path.join(process.cwd(), file);
  const targetPath = path.join(process.cwd(), targetDir, file);
  
  try {
    // Verificar se já existe no destino
    if (fs.existsSync(targetPath)) {
      console.log(`⚠️  Já existe: ${targetDir}/${file}`);
      filesSkipped++;
      return;
    }
    
    // Mover arquivo
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ Movido: ${file} → ${targetDir}/`);
    filesMoved++;
  } catch (error) {
    console.error(`❌ Erro ao mover ${file}: ${error.message}`);
  }
});

console.log('\n═'.repeat(60));
console.log('📊 RESUMO');
console.log('═'.repeat(60));
console.log(`✅ Arquivos movidos: ${filesMoved}`);
console.log(`⏭️  Arquivos mantidos na raiz: ${filesSkipped}`);
console.log('═'.repeat(60));

// Criar índice de documentação
const indexContent = `# 📚 Índice de Documentação - SuaGrana

## 📁 Estrutura

### 🔍 Auditorias (\`docs/audits/\`)
Relatórios de análise e auditoria do sistema.

${fs.readdirSync(path.join(process.cwd(), 'docs/audits'))
  .filter(f => f.endsWith('.md'))
  .map(f => `- [${f.replace('.md', '')}](./audits/${f})`)
  .join('\n')}

### 💻 Desenvolvimento (\`docs/development/\`)
Guias e documentação para desenvolvedores.

${fs.readdirSync(path.join(process.cwd(), 'docs/development'))
  .filter(f => f.endsWith('.md'))
  .map(f => `- [${f.replace('.md', '')}](./development/${f})`)
  .join('\n')}

### 🏗️ Arquitetura (\`docs/architecture/\`)
Documentação de arquitetura e implementação.

${fs.readdirSync(path.join(process.cwd(), 'docs/architecture'))
  .filter(f => f.endsWith('.md'))
  .map(f => `- [${f.replace('.md', '')}](./architecture/${f})`)
  .join('\n')}

### 🚀 Deploy (\`docs/deployment/\`)
Guias de deploy e configuração de infraestrutura.

${fs.readdirSync(path.join(process.cwd(), 'docs/deployment'))
  .filter(f => f.endsWith('.md'))
  .map(f => `- [${f.replace('.md', '')}](./deployment/${f})`)
  .join('\n')}

---

**Última Atualização:** ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(process.cwd(), 'docs', 'README.md'), indexContent);
console.log('\n✅ Índice criado: docs/README.md');

console.log('\n🎉 Organização concluída!');
console.log('📝 Próximos passos:');
console.log('   1. Revisar estrutura: ls -la docs/');
console.log('   2. Atualizar links em outros arquivos');
console.log('   3. Commit: git add docs/ && git commit -m "docs: organize documentation"');

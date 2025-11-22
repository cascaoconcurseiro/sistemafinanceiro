#!/usr/bin/env node

/**
 * Script para limpar o projeto de arquivos desnecessários
 * Executa as ações críticas identificadas na análise
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Iniciando Limpeza do Projeto...\n');

const actions = {
  completed: [],
  failed: [],
  skipped: []
};

// ============================================
// 1. VERIFICAR BACKUPS NO REPOSITÓRIO
// ============================================
console.log('📋 Verificando Backups no Repositório...');

function findBackupFolders(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // Ignorar node_modules e .git
      if (file === 'node_modules' || file === '.git') continue;
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Verificar se é pasta de backup
        if (file.includes('BACKUP') || file.includes('backup') || file.includes('-backup-')) {
          results.push(filePath);
        } else {
          findBackupFolders(filePath, results);
        }
      }
    }
  } catch (error) {
    // Ignorar erros de permissão
  }
  
  return results;
}

const backupFolders = findBackupFolders(process.cwd());

if (backupFolders.length > 0) {
  console.log(`⚠️  Encontradas ${backupFolders.length} pastas de backup:`);
  backupFolders.forEach(folder => {
    const relativePath = path.relative(process.cwd(), folder);
    console.log(`   - ${relativePath}`);
  });
  console.log('\n⚠️  AÇÃO NECESSÁRIA:');
  console.log('   1. Mover estas pastas para fora do repositório Git');
  console.log('   2. Adicionar ao .gitignore');
  console.log('   3. Executar: git rm -r --cached "pasta-backup"');
  console.log('   4. Commit: git commit -m "Remove backup folders from repository"');
  actions.skipped.push('Backups encontrados - ação manual necessária');
} else {
  console.log('✅ Nenhuma pasta de backup encontrada no repositório');
  actions.completed.push('Verificação de backups');
}
console.log('');

// ============================================
// 2. VERIFICAR DUPLICAÇÃO DE SERVIÇOS
// ============================================
console.log('📋 Verificando Duplicação de Serviços...');

const srcServicesPath = path.join(process.cwd(), 'src', 'services');
const libServicesPath = path.join(process.cwd(), 'src', 'lib', 'services');

const hasSrcServices = fs.existsSync(srcServicesPath);
const hasLibServices = fs.existsSync(libServicesPath);

if (hasSrcServices && hasLibServices) {
  console.log('⚠️  Duplicação detectada:');
  console.log('   - src/services/ existe');
  console.log('   - src/lib/services/ existe');
  console.log('\n⚠️  AÇÃO NECESSÁRIA:');
  console.log('   1. Consolidar todos os serviços em src/lib/services/');
  console.log('   2. Atualizar imports em todos os arquivos');
  console.log('   3. Remover src/services/');
  actions.skipped.push('Duplicação de serviços - ação manual necessária');
} else if (hasLibServices) {
  console.log('✅ Serviços consolidados em src/lib/services/');
  actions.completed.push('Estrutura de serviços');
} else {
  console.log('⚠️  Nenhuma pasta de serviços encontrada');
  actions.skipped.push('Estrutura de serviços não encontrada');
}
console.log('');

// ============================================
// 3. VERIFICAR ARQUIVOS .md NA RAIZ
// ============================================
console.log('📋 Verificando Arquivos .md na Raiz...');

const rootFiles = fs.readdirSync(process.cwd());
const mdFiles = rootFiles.filter(file => 
  file.endsWith('.md') && 
  !['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE.md'].includes(file)
);

if (mdFiles.length > 0) {
  console.log(`⚠️  Encontrados ${mdFiles.length} arquivos .md na raiz:`);
  
  const categories = {
    analise: [],
    guia: [],
    implementacao: [],
    outros: []
  };
  
  mdFiles.forEach(file => {
    if (file.startsWith('ANALISE-')) categories.analise.push(file);
    else if (file.startsWith('GUIA-')) categories.guia.push(file);
    else if (file.startsWith('IMPLEMENTACAO-')) categories.implementacao.push(file);
    else categories.outros.push(file);
  });
  
  console.log('\n📁 Sugestão de Organização:');
  if (categories.analise.length > 0) {
    console.log('   docs/audits/');
    categories.analise.forEach(f => console.log(`      - ${f}`));
  }
  if (categories.guia.length > 0) {
    console.log('   docs/development/');
    categories.guia.forEach(f => console.log(`      - ${f}`));
  }
  if (categories.implementacao.length > 0) {
    console.log('   docs/architecture/');
    categories.implementacao.forEach(f => console.log(`      - ${f}`));
  }
  if (categories.outros.length > 0) {
    console.log('   docs/');
    categories.outros.forEach(f => console.log(`      - ${f}`));
  }
  
  actions.skipped.push(`${mdFiles.length} arquivos .md para organizar`);
} else {
  console.log('✅ Documentação organizada');
  actions.completed.push('Organização de documentação');
}
console.log('');

// ============================================
// 4. VERIFICAR CÓDIGO DEPRECATED
// ============================================
console.log('📋 Verificando Código DEPRECATED...');

function findDeprecatedCode(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // Ignorar node_modules, .git, .next
      if (file === 'node_modules' || file === '.git' || file === '.next') continue;
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findDeprecatedCode(filePath, results);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('DEPRECATED') || content.includes('@deprecated')) {
          results.push({
            file: path.relative(process.cwd(), filePath),
            matches: (content.match(/DEPRECATED|@deprecated/g) || []).length
          });
        }
      }
    }
  } catch (error) {
    // Ignorar erros
  }
  
  return results;
}

const deprecatedFiles = findDeprecatedCode(path.join(process.cwd(), 'src'));

if (deprecatedFiles.length > 0) {
  console.log(`⚠️  Encontrados ${deprecatedFiles.length} arquivos com código DEPRECATED:`);
  deprecatedFiles.forEach(({ file, matches }) => {
    console.log(`   - ${file} (${matches} ocorrências)`);
  });
  console.log('\n⚠️  AÇÃO NECESSÁRIA:');
  console.log('   1. Revisar cada arquivo');
  console.log('   2. Remover código deprecated ou substituir');
  console.log('   3. Atualizar dependências');
  actions.skipped.push(`${deprecatedFiles.length} arquivos com código deprecated`);
} else {
  console.log('✅ Nenhum código DEPRECATED encontrado');
  actions.completed.push('Verificação de código deprecated');
}
console.log('');

// ============================================
// 5. VERIFICAR CONSOLE.LOG
// ============================================
console.log('📋 Verificando console.log não condicionados...');

function findConsoleLogs(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      if (file === 'node_modules' || file === '.git' || file === '.next') continue;
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findConsoleLogs(filePath, results);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Verificar console.log sem condicional NODE_ENV
          if (line.includes('console.log') || line.includes('console.warn')) {
            const prevLines = lines.slice(Math.max(0, index - 2), index).join('\n');
            if (!prevLines.includes('NODE_ENV') && !prevLines.includes('process.env')) {
              results.push({
                file: path.relative(process.cwd(), filePath),
                line: index + 1,
                code: line.trim()
              });
            }
          }
        });
      }
    }
  } catch (error) {
    // Ignorar erros
  }
  
  return results;
}

const consoleLogs = findConsoleLogs(path.join(process.cwd(), 'src'));

if (consoleLogs.length > 0) {
  console.log(`⚠️  Encontrados ${consoleLogs.length} console.log não condicionados`);
  console.log('   (Mostrando primeiros 5):');
  consoleLogs.slice(0, 5).forEach(({ file, line }) => {
    console.log(`   - ${file}:${line}`);
  });
  if (consoleLogs.length > 5) {
    console.log(`   ... e mais ${consoleLogs.length - 5}`);
  }
  console.log('\n💡 Sugestão: Condicionar com NODE_ENV ou usar logger');
  actions.skipped.push(`${consoleLogs.length} console.log para revisar`);
} else {
  console.log('✅ Todos os console.log estão condicionados');
  actions.completed.push('Verificação de console.log');
}
console.log('');

// ============================================
// RESUMO
// ============================================
console.log('═'.repeat(60));
console.log('📊 RESUMO DA LIMPEZA');
console.log('═'.repeat(60));
console.log(`✅ Verificações Completas: ${actions.completed.length}`);
console.log(`⚠️  Ações Necessárias: ${actions.skipped.length}`);
console.log(`❌ Falhas: ${actions.failed.length}`);
console.log('═'.repeat(60));
console.log('');

if (actions.completed.length > 0) {
  console.log('✅ COMPLETO:');
  actions.completed.forEach(action => console.log(`   - ${action}`));
  console.log('');
}

if (actions.skipped.length > 0) {
  console.log('⚠️  AÇÃO MANUAL NECESSÁRIA:');
  actions.skipped.forEach(action => console.log(`   - ${action}`));
  console.log('');
}

// Salvar relatório
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    completed: actions.completed.length,
    skipped: actions.skipped.length,
    failed: actions.failed.length
  },
  details: {
    backupFolders,
    mdFiles,
    deprecatedFiles,
    consoleLogs: consoleLogs.length
  },
  actions
};

const reportPath = path.join(process.cwd(), 'RELATORIO-LIMPEZA.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Relatório completo salvo em: RELATORIO-LIMPEZA.json`);
console.log('');

// Criar script de ação
const actionScript = `#!/bin/bash

# Script gerado automaticamente para executar ações de limpeza
# Data: ${new Date().toISOString()}

echo "🧹 Executando Limpeza do Projeto..."
echo ""

${backupFolders.length > 0 ? `
# 1. Remover pastas de backup do Git
echo "📋 Removendo backups do repositório..."
${backupFolders.map(folder => {
  const relativePath = path.relative(process.cwd(), folder);
  return `git rm -r --cached "${relativePath}"`;
}).join('\n')}
echo "✅ Backups removidos"
echo ""
` : ''}

${hasSrcServices && hasLibServices ? `
# 2. Consolidar serviços
echo "📋 Consolidando serviços..."
echo "⚠️  AÇÃO MANUAL: Mover arquivos de src/services/ para src/lib/services/"
echo "⚠️  AÇÃO MANUAL: Atualizar imports"
echo ""
` : ''}

${mdFiles.length > 0 ? `
# 3. Organizar documentação
echo "📋 Organizando documentação..."
mkdir -p docs/audits docs/development docs/architecture
${mdFiles.map(file => {
  let targetDir = 'docs/';
  if (file.startsWith('ANALISE-')) targetDir = 'docs/audits/';
  else if (file.startsWith('GUIA-')) targetDir = 'docs/development/';
  else if (file.startsWith('IMPLEMENTACAO-')) targetDir = 'docs/architecture/';
  return `git mv "${file}" "${targetDir}"`;
}).join('\n')}
echo "✅ Documentação organizada"
echo ""
` : ''}

echo "🎉 Limpeza concluída!"
echo "📝 Próximos passos:"
echo "   1. Revisar mudanças: git status"
echo "   2. Commit: git commit -m 'chore: cleanup project structure'"
echo "   3. Push: git push"
`;

const scriptPath = path.join(process.cwd(), 'scripts', 'execute-cleanup.sh');
fs.writeFileSync(scriptPath, actionScript);
fs.chmodSync(scriptPath, '755');
console.log(`📝 Script de ação criado: scripts/execute-cleanup.sh`);
console.log('   Execute: bash scripts/execute-cleanup.sh');
console.log('');

console.log('🎯 Próximos Passos:');
console.log('   1. Revisar o relatório: RELATORIO-LIMPEZA.json');
console.log('   2. Executar ações manuais necessárias');
console.log('   3. Executar: bash scripts/execute-cleanup.sh');
console.log('   4. Commit e push das mudanças');

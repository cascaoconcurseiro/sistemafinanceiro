#!/usr/bin/env node

/**
 * Script para identificar e remover código morto
 */

const fs = require('fs');
const path = require('path');

console.log('🗑️  Identificando Código Morto...\n');

const issues = [];

// ============================================
// TAREFA 1: Identificar arquivos DEPRECATED
// ============================================
console.log('📋 Tarefa 1: Procurando código DEPRECATED');
try {
  const deprecatedFiles = [];
  
  function searchDeprecated(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
        searchDeprecated(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('DEPRECATED') || content.includes('@deprecated')) {
          deprecatedFiles.push({
            file: fullPath.replace(path.join(__dirname, '..'), ''),
            lines: content.split('\n').map((line, i) => 
              line.includes('DEPRECATED') || line.includes('@deprecated') ? i + 1 : null
            ).filter(Boolean)
          });
        }
      }
    });
  }
  
  searchDeprecated(path.join(__dirname, '../src'));
  
  if (deprecatedFiles.length > 0) {
    console.log(`⚠️  Encontrados ${deprecatedFiles.length} arquivos com código DEPRECATED:\n`);
    deprecatedFiles.forEach(item => {
      console.log(`   ${item.file} (linhas: ${item.lines.join(', ')})`);
    });
    issues.push(...deprecatedFiles);
  } else {
    console.log('✅ Nenhum código DEPRECATED encontrado');
  }
} catch (error) {
  console.log('❌ Erro ao procurar código DEPRECATED:', error.message);
}
console.log('');

// ============================================
// TAREFA 2: Identificar código comentado
// ============================================
console.log('📋 Tarefa 2: Procurando código comentado extenso');
try {
  const commentedCode = [];
  
  function searchCommentedCode(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
        searchCommentedCode(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        let commentBlock = [];
        let blockStart = 0;
        
        lines.forEach((line, i) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
            if (commentBlock.length === 0) blockStart = i + 1;
            commentBlock.push(line);
          } else if (commentBlock.length > 0) {
            if (commentBlock.length > 10) { // Mais de 10 linhas comentadas
              commentedCode.push({
                file: fullPath.replace(path.join(__dirname, '..'), ''),
                start: blockStart,
                end: i,
                lines: commentBlock.length
              });
            }
            commentBlock = [];
          }
        });
      }
    });
  }
  
  searchCommentedCode(path.join(__dirname, '../src'));
  
  if (commentedCode.length > 0) {
    console.log(`⚠️  Encontrados ${commentedCode.length} blocos de código comentado:\n`);
    commentedCode.slice(0, 10).forEach(item => {
      console.log(`   ${item.file} (linhas ${item.start}-${item.end}, ${item.lines} linhas)`);
    });
    if (commentedCode.length > 10) {
      console.log(`   ... e mais ${commentedCode.length - 10} blocos`);
    }
  } else {
    console.log('✅ Nenhum bloco extenso de código comentado encontrado');
  }
} catch (error) {
  console.log('❌ Erro ao procurar código comentado:', error.message);
}
console.log('');

// ============================================
// TAREFA 3: Identificar imports não utilizados
// ============================================
console.log('📋 Tarefa 3: Verificando imports não utilizados');
console.log('ℹ️  Execute: npx ts-prune para análise completa');
console.log('');

// ============================================
// RESUMO
// ============================================
console.log('═'.repeat(60));
console.log('📊 RESUMO');
console.log('═'.repeat(60));
console.log(`⚠️  Problemas encontrados: ${issues.length}`);
console.log('═'.repeat(60));

if (issues.length > 0) {
  console.log('\n📋 Ações Recomendadas:');
  console.log('1. Revisar arquivos DEPRECATED');
  console.log('2. Remover ou reativar código comentado');
  console.log('3. Executar: npx ts-prune para encontrar exports não utilizados');
  console.log('4. Executar: npx depcheck para encontrar dependências não utilizadas');
}

// Salvar relatório
const report = {
  timestamp: new Date().toISOString(),
  issues,
  summary: {
    deprecated: issues.filter(i => i.lines).length,
    commented: issues.filter(i => i.start).length,
  }
};

const reportPath = path.join(__dirname, '../DEAD-CODE-REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Relatório salvo em: DEAD-CODE-REPORT.json`);

console.log('\n✨ Análise de código morto concluída!');

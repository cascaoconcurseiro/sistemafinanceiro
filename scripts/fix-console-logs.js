#!/usr/bin/env node

/**
 * Script para corrigir console.log não condicionados
 * Adiciona verificação de NODE_ENV automaticamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo console.log não condicionados...\n');

let filesFixed = 0;
let logsFixed = 0;

function fixConsoleLogs(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // Ignorar node_modules, .git, .next
      if (file === 'node_modules' || file === '.git' || file === '.next') continue;
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        fixConsoleLogs(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let fileModified = false;
        let fileLogsFixed = 0;
        
        const lines = content.split('\n');
        const newLines = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const prevLine = i > 0 ? lines[i - 1] : '';
          const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
          
          // Verificar se é console.log/warn/error sem condicional
          if ((line.includes('console.log(') || line.includes('console.warn(')) && 
              !prevLine.includes('NODE_ENV') && 
              !prevLine.includes('process.env') &&
              !line.trim().startsWith('//')) {
            
            const indent = line.match(/^\s*/)[0];
            
            // Adicionar condicional
            newLines.push(`${indent}if (process.env.NODE_ENV !== 'production') {`);
            newLines.push(line);
            newLines.push(`${indent}}`);
            
            fileModified = true;
            fileLogsFixed++;
          } else {
            newLines.push(line);
          }
        }
        
        if (fileModified) {
          fs.writeFileSync(filePath, newLines.join('\n'));
          filesFixed++;
          logsFixed += fileLogsFixed;
          
          const relativePath = path.relative(process.cwd(), filePath);
          console.log(`✅ ${relativePath} (${fileLogsFixed} logs corrigidos)`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar: ${error.message}`);
  }
}

// Executar correção
const srcPath = path.join(process.cwd(), 'src');
fixConsoleLogs(srcPath);

console.log('\n═'.repeat(60));
console.log('📊 RESUMO');
console.log('═'.repeat(60));
console.log(`✅ Arquivos corrigidos: ${filesFixed}`);
console.log(`✅ Console.log condicionados: ${logsFixed}`);
console.log('═'.repeat(60));

if (filesFixed > 0) {
  console.log('\n🎉 Correções aplicadas com sucesso!');
  console.log('📝 Próximos passos:');
  console.log('   1. Revisar mudanças: git diff');
  console.log('   2. Testar aplicação: npm run dev');
  console.log('   3. Commit: git commit -m "fix: add NODE_ENV check to console.log"');
} else {
  console.log('\n✅ Nenhuma correção necessária!');
}

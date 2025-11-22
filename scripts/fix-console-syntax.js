#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo sintaxe de console.log...\n');

let filesFixed = 0;

function fixConsoleSyntax(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      if (file === 'node_modules' || file === '.git' || file === '.next') continue;
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        fixConsoleSyntax(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Padrão: console.log('...', {\n      }\n        prop: value
        // Corrigir para: console.log('...', {\n          prop: value
        content = content.replace(
          /(console\.log\([^{]+\{\s*\n\s*\}\s*\n\s*)/g,
          (match) => {
            return match.replace(/\{\s*\n\s*\}\s*\n\s*/, '{\n          ');
          }
        );
        
        // Padrão mais específico: if (process.env...) {\n      console.log(..., {\n      }\n        
        content = content.replace(
          /(if \(process\.env\.NODE_ENV[^{]+\{\s*\n\s*)(console\.log\([^{]+\{\s*\n\s*\}\s*\n\s*)/g,
          (match, ifPart, consolePart) => {
            const fixed = consolePart.replace(/\{\s*\n\s*\}\s*\n\s*/, '{\n          ');
            return ifPart + '  ' + fixed;
          }
        );
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          filesFixed++;
          const relativePath = path.relative(process.cwd(), filePath);
          console.log(`✅ ${relativePath}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }
}

const srcPath = path.join(process.cwd(), 'src');
fixConsoleSyntax(srcPath);

console.log(`\n✅ ${filesFixed} arquivos corrigidos`);

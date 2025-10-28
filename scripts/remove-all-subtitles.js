#!/usr/bin/env node
/**
 * Script para remover todos os subtitles das páginas
 * Remove apenas a linha subtitle="..." mantendo tudo mais
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let filesModified = 0;
let subtitlesRemoved = 0;

function removeSubtitles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Padrão para encontrar subtitle (com ou sem quebra de linha)
    const patterns = [
      // subtitle="texto" na mesma linha
      /\s+subtitle="[^"]*"/g,
      // subtitle="texto" com quebra de linha antes
      /\n\s+subtitle="[^"]*"/g,
      // subtitle='texto' com aspas simples
      /\s+subtitle='[^']*'/g,
      /\n\s+subtitle='[^']*'/g,
    ];
    
    let modified = false;
    let removedCount = 0;
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        removedCount += matches.length;
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      subtitlesRemoved += removedCount;
      
      const relativePath = filePath.replace(process.cwd(), '.');
      console.log(`${colors.green}✓${colors.reset} ${relativePath} (${removedCount} subtitle${removedCount > 1 ? 's' : ''} removido${removedCount > 1 ? 's' : ''})`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`${colors.yellow}⚠${colors.reset} Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile() && entry.name === 'page.tsx') {
        removeSubtitles(fullPath);
      }
    });
  } catch (error) {
    // Ignorar erros de leitura
  }
}

console.log(colors.cyan + '\n🔧 Removendo subtitles de todas as páginas...\n' + colors.reset);

// Escanear diretório src/app
const appDir = path.join(process.cwd(), 'src', 'app');
if (fs.existsSync(appDir)) {
  scanDirectory(appDir);
}

console.log(colors.blue + '\n' + '─'.repeat(60) + colors.reset);
console.log(colors.cyan + '\n📊 RESUMO:\n' + colors.reset);
console.log(`${colors.green}✓${colors.reset} Arquivos modificados: ${filesModified}`);
console.log(`${colors.green}✓${colors.reset} Subtitles removidos: ${subtitlesRemoved}`);
console.log('');

if (filesModified === 0) {
  console.log(colors.yellow + '⚠️  Nenhum subtitle encontrado para remover.' + colors.reset);
} else {
  console.log(colors.green + '✅ Todos os subtitles foram removidos com sucesso!' + colors.reset);
}

console.log('');

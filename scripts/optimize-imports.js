#!/usr/bin/env node

/**
 * Script para otimizar imports
 * - Ordena imports alfabeticamente
 * - Agrupa imports por tipo (React, Next, libs, local)
 * - Remove linhas vazias extras
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
  'src/app',
  'src/components',
  'src/lib',
  'src/hooks',
  'src/contexts',
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

let totalFiles = 0;
let filesModified = 0;

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function categorizeImport(importLine) {
  if (importLine.includes("from 'react'") || importLine.includes('from "react"')) {
    return 1; // React
  }
  if (importLine.includes("from 'next") || importLine.includes('from "next')) {
    return 2; // Next.js
  }
  if (importLine.startsWith("import type")) {
    return 3; // Types
  }
  if (importLine.includes("from '@/")) {
    return 5; // Local absolute
  }
  if (importLine.includes("from './") || importLine.includes('from "../')) {
    return 6; // Local relative
  }
  return 4; // External libs
}

function optimizeImports(content) {
  const lines = content.split('\n');
  const imports = [];
  const otherLines = [];
  let inImportBlock = true;
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('import ')) {
      imports.push(lines[i]);
      inImportBlock = true;
    } else if (line === '' && inImportBlock) {
      // Skip empty lines in import block
      continue;
    } else {
      if (inImportBlock && line !== '') {
        inImportBlock = false;
      }
      otherLines.push(lines[i]);
    }
  }

  if (imports.length === 0) {
    return { content, modified: false };
  }

  // Ordenar imports
  const sortedImports = imports.sort((a, b) => {
    const catA = categorizeImport(a);
    const catB = categorizeImport(b);
    
    if (catA !== catB) {
      return catA - catB;
    }
    
    return a.localeCompare(b);
  });

  // Agrupar por categoria
  const grouped = [];
  let lastCategory = -1;

  sortedImports.forEach(imp => {
    const category = categorizeImport(imp);
    if (lastCategory !== -1 && lastCategory !== category) {
      grouped.push(''); // Linha vazia entre grupos
    }
    grouped.push(imp);
    lastCategory = category;
  });

  // Verificar se houve mudança
  const originalImports = imports.join('\n');
  const newImports = grouped.join('\n');
  modified = originalImports !== newImports;

  // Reconstruir arquivo
  const newContent = [...grouped, '', ...otherLines].join('\n');

  return { content: newContent, modified };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, modified } = optimizeImports(content);

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      filesModified++;
      console.log(`✅ ${filePath}`);
    }

    totalFiles++;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao escanear ${dirPath}:`, error.message);
  }
}

console.log('📦 Otimizando imports...\n');

for (const dir of DIRECTORIES_TO_SCAN) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Escaneando: ${dir}`);
    scanDirectory(fullPath);
  }
}

console.log('\n📊 RESUMO:');
console.log(`   Arquivos processados: ${totalFiles}`);
console.log(`   Arquivos modificados: ${filesModified}`);
console.log('\n✅ Otimização concluída!');

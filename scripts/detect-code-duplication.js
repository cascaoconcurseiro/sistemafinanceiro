#!/usr/bin/env node

/**
 * Script para detectar código duplicado
 * Identifica blocos de código similares
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIRECTORIES_TO_SCAN = [
  'src/app',
  'src/components',
  'src/lib',
  'src/hooks',
  'src/contexts',
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const MIN_LINES = 5; // Mínimo de linhas para considerar duplicação

let totalFiles = 0;
const codeBlocks = new Map();
const duplicates = [];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function normalizeCode(code) {
  return code
    .replace(/\/\/.*/g, '') // Remove comentários de linha
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários de bloco
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

function extractCodeBlocks(content, filePath) {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length - MIN_LINES; i++) {
    const block = lines.slice(i, i + MIN_LINES).join('\n');
    const normalized = normalizeCode(block);
    
    if (normalized.length < 20) continue; // Ignora blocos muito pequenos
    
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    
    if (!codeBlocks.has(hash)) {
      codeBlocks.set(hash, []);
    }
    
    codeBlocks.get(hash).push({
      file: filePath,
      startLine: i + 1,
      endLine: i + MIN_LINES,
      code: block,
    });
  }
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    extractCodeBlocks(content, filePath);
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

console.log('🔍 Detectando código duplicado...\n');

for (const dir of DIRECTORIES_TO_SCAN) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Escaneando: ${dir}`);
    scanDirectory(fullPath);
  }
}

console.log('\n📊 ANALISANDO DUPLICAÇÕES...\n');

// Encontrar duplicações
for (const [hash, blocks] of codeBlocks.entries()) {
  if (blocks.length > 1) {
    // Verificar se não são do mesmo arquivo (linhas próximas)
    const uniqueFiles = new Set(blocks.map(b => b.file));
    if (uniqueFiles.size > 1 || blocks.length > 2) {
      duplicates.push({
        hash,
        count: blocks.length,
        blocks,
      });
    }
  }
}

console.log('📊 CÓDIGO DUPLICADO ENCONTRADO:\n');

if (duplicates.length === 0) {
  console.log('✅ Nenhuma duplicação significativa encontrada!');
} else {
  duplicates
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach((dup, index) => {
      console.log(`\n${index + 1}. DUPLICAÇÃO (${dup.count} ocorrências):`);
      console.log('─'.repeat(60));
      
      dup.blocks.slice(0, 3).forEach(block => {
        console.log(`   📄 ${block.file}:${block.startLine}-${block.endLine}`);
      });
      
      if (dup.blocks.length > 3) {
        console.log(`   ... e mais ${dup.blocks.length - 3} ocorrências`);
      }
      
      console.log('\n   Código:');
      const preview = dup.blocks[0].code.split('\n').slice(0, 3).join('\n');
      console.log('   ' + preview.replace(/\n/g, '\n   '));
      console.log('   ...');
    });
  
  if (duplicates.length > 10) {
    console.log(`\n... e mais ${duplicates.length - 10} duplicações`);
  }
}

console.log('\n📊 RESUMO:');
console.log(`   Arquivos processados: ${totalFiles}`);
console.log(`   Blocos de código analisados: ${codeBlocks.size}`);
console.log(`   Duplicações encontradas: ${duplicates.length}`);
console.log(`   Total de ocorrências: ${duplicates.reduce((sum, d) => sum + d.count, 0)}`);

console.log('\n💡 RECOMENDAÇÕES:');
console.log('   1. Extrair código duplicado para funções utilitárias');
console.log('   2. Criar hooks customizados para lógica React duplicada');
console.log('   3. Usar composição ao invés de duplicação');
console.log('\n✅ Análise concluída!');

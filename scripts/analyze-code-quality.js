#!/usr/bin/env node

/**
 * Script para analisar qualidade do código
 * - Funções muito longas (>50 linhas)
 * - Complexidade ciclomática alta
 * - Arquivos muito grandes (>500 linhas)
 * - Imports não usados
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

const issues = {
  longFunctions: [],
  largeFiles: [],
  highComplexity: [],
  unusedImports: [],
};

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function analyzeFunctionLength(content, filePath) {
  const lines = content.split('\n');
  let inFunction = false;
  let functionStart = 0;
  let functionName = '';
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detecta início de função
    const functionMatch = line.match(/(?:function|const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*(?:=>)?\s*\{/);
    if (functionMatch && !inFunction) {
      inFunction = true;
      functionStart = i;
      functionName = functionMatch[1];
      braceCount = 1;
      continue;
    }

    if (inFunction) {
      // Conta chaves
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      // Fim da função
      if (braceCount === 0) {
        const functionLength = i - functionStart + 1;
        if (functionLength > 50) {
          issues.longFunctions.push({
            file: filePath,
            function: functionName,
            lines: functionLength,
            startLine: functionStart + 1,
          });
        }
        inFunction = false;
      }
    }
  }
}

function analyzeComplexity(content, filePath) {
  // Conta estruturas de controle (if, for, while, switch, etc)
  const controlStructures = [
    /\bif\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bswitch\s*\(/g,
    /\bcatch\s*\(/g,
    /\?\s*.*\s*:/g, // ternário
    /&&/g,
    /\|\|/g,
  ];

  let complexity = 0;
  for (const pattern of controlStructures) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  const lines = content.split('\n').length;
  const complexityRatio = complexity / lines;

  if (complexityRatio > 0.15) {
    issues.highComplexity.push({
      file: filePath,
      complexity,
      lines,
      ratio: complexityRatio.toFixed(2),
    });
  }
}

function analyzeUnusedImports(content, filePath) {
  const importPattern = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"][^'"]+['"]/g;
  const matches = [...content.matchAll(importPattern)];

  for (const match of matches) {
    const imports = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];
    
    for (const importName of imports) {
      const cleanName = importName.replace(/\s+as\s+\w+/, '').trim();
      
      // Verifica se é usado no código (simples)
      const usagePattern = new RegExp(`\\b${cleanName}\\b`, 'g');
      const usages = content.match(usagePattern);
      
      // Se aparece apenas 1 vez (na própria importação), pode estar não usado
      if (usages && usages.length === 1) {
        issues.unusedImports.push({
          file: filePath,
          import: cleanName,
        });
      }
    }
  }
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;

    // Arquivo muito grande
    if (lines > 500) {
      issues.largeFiles.push({
        file: filePath,
        lines,
      });
    }

    analyzeFunctionLength(content, filePath);
    analyzeComplexity(content, filePath);
    analyzeUnusedImports(content, filePath);
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

console.log('🔍 Analisando qualidade do código...\n');

for (const dir of DIRECTORIES_TO_SCAN) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    scanDirectory(fullPath);
  }
}

console.log('\n📊 RELATÓRIO DE QUALIDADE:\n');

console.log('📏 FUNÇÕES LONGAS (>50 linhas):');
if (issues.longFunctions.length === 0) {
  console.log('   ✅ Nenhuma função longa encontrada');
} else {
  issues.longFunctions
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10)
    .forEach(issue => {
      console.log(`   ⚠️  ${issue.function} (${issue.lines} linhas) - ${issue.file}:${issue.startLine}`);
    });
  if (issues.longFunctions.length > 10) {
    console.log(`   ... e mais ${issues.longFunctions.length - 10} funções`);
  }
}

console.log('\n📦 ARQUIVOS GRANDES (>500 linhas):');
if (issues.largeFiles.length === 0) {
  console.log('   ✅ Nenhum arquivo grande encontrado');
} else {
  issues.largeFiles
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10)
    .forEach(issue => {
      console.log(`   ⚠️  ${issue.lines} linhas - ${issue.file}`);
    });
  if (issues.largeFiles.length > 10) {
    console.log(`   ... e mais ${issues.largeFiles.length - 10} arquivos`);
  }
}

console.log('\n🔀 COMPLEXIDADE ALTA (>15%):');
if (issues.highComplexity.length === 0) {
  console.log('   ✅ Nenhum arquivo com alta complexidade');
} else {
  issues.highComplexity
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10)
    .forEach(issue => {
      console.log(`   ⚠️  ${issue.ratio} (${issue.complexity} estruturas em ${issue.lines} linhas) - ${issue.file}`);
    });
  if (issues.highComplexity.length > 10) {
    console.log(`   ... e mais ${issues.highComplexity.length - 10} arquivos`);
  }
}

console.log('\n📥 POSSÍVEIS IMPORTS NÃO USADOS:');
if (issues.unusedImports.length === 0) {
  console.log('   ✅ Nenhum import não usado encontrado');
} else {
  const grouped = {};
  issues.unusedImports.forEach(issue => {
    if (!grouped[issue.file]) grouped[issue.file] = [];
    grouped[issue.file].push(issue.import);
  });

  Object.entries(grouped)
    .slice(0, 10)
    .forEach(([file, imports]) => {
      console.log(`   ⚠️  ${file}`);
      console.log(`      ${imports.join(', ')}`);
    });
  
  if (Object.keys(grouped).length > 10) {
    console.log(`   ... e mais ${Object.keys(grouped).length - 10} arquivos`);
  }
}

console.log('\n📊 RESUMO:');
console.log(`   Funções longas: ${issues.longFunctions.length}`);
console.log(`   Arquivos grandes: ${issues.largeFiles.length}`);
console.log(`   Alta complexidade: ${issues.highComplexity.length}`);
console.log(`   Imports não usados: ${issues.unusedImports.length}`);

const totalIssues = 
  issues.longFunctions.length +
  issues.largeFiles.length +
  issues.highComplexity.length +
  issues.unusedImports.length;

console.log(`\n   Total de problemas: ${totalIssues}`);
console.log('\n✅ Análise concluída!');

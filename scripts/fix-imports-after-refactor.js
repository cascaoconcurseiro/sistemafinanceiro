/**
 * Corrige todos os imports após a refatoração
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');

console.log('🔧 CORRIGINDO IMPORTS APÓS REFATORAÇÃO\n');

// Mapeamento de imports antigos para novos
const importMappings = {
  // API
  "@/lib/api-client'": "@/lib/api/api-client'",
  '@/lib/api-client"': '@/lib/api/api-client"',
  "@/lib/optimized-api-client'": "@/lib/api/optimized-api-client'",
  '@/lib/optimized-api-client"': '@/lib/api/optimized-api-client"',
  "@/lib/react-query'": "@/lib/api/react-query'",
  '@/lib/react-query"': '@/lib/api/react-query"',
  
  // Auth
  "@/lib/auth'": "@/lib/auth/auth'",
  '@/lib/auth"': '@/lib/auth/auth"',
  "@/lib/auth-helpers'": "@/lib/auth/auth-helpers'",
  '@/lib/auth-helpers"': '@/lib/auth/auth-helpers"',
  
  // Providers
  "@/providers/": "@/components/providers/",
  
  // Cache
  "@/lib/cache'": "@/lib/cache/cache'",
  '@/lib/cache"': '@/lib/cache/cache"',
  
  // Config
  "@/lib/config'": "@/lib/config/config'",
  '@/lib/config"': '@/lib/config/config"',
  "@/lib/storage'": "@/lib/config/storage'",
  '@/lib/storage"': '@/lib/config/storage"',
  
  // Logging
  "@/lib/logger'": "@/lib/logging/logger'",
  '@/lib/logger"': '@/lib/logging/logger"',
  
  // Utils
  "@/lib/error-handler'": "@/lib/utils/error-handler'",
  '@/lib/error-handler"': '@/lib/utils/error-handler"',
};

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      if (content.includes(oldImport)) {
        content = content.replaceAll(oldImport, newImport);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${path.relative(srcDir, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`✗ Erro em ${path.relative(srcDir, filePath)}`);
    return false;
  }
}

function walkDir(dir) {
  let fixed = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist'].includes(file)) {
        fixed += walkDir(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (fixImportsInFile(filePath)) {
        fixed++;
      }
    }
  }
  
  return fixed;
}

const fixed = walkDir(srcDir);

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Imports corrigidos: ${fixed} arquivos`);
console.log('\n🔄 Reinicie o servidor para aplicar as mudanças\n');

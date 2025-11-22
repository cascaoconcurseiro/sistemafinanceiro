/**
 * Corrige TODOS os imports relativos após refatoração
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

console.log('🔧 CORRIGINDO TODOS OS IMPORTS RELATIVOS\n');

let fixed = 0;

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Corrigir imports relativos comuns
    const fixes = [
      // Auth
      [/from ['"]\.\/prisma['"]/g, "from '@/lib/prisma'"],
      [/from ['"]\.\/security-logger['"]/g, "from '@/lib/logging/security-logger'"],
      [/from ['"]\.\/auth['"]/g, "from '@/lib/auth/auth'"],
      [/from ['"]\.\/auth-helpers['"]/g, "from '@/lib/auth/auth-helpers'"],
      
      // Database
      [/from ['"]\.\/prisma-middleware\.ts['"]/g, "from '@/lib/database/prisma-middleware'"],
      [/from ['"]\.\/prisma-middleware['"]/g, "from '@/lib/database/prisma-middleware'"],
      [/from ['"]\.\/db['"]/g, "from '@/lib/db'"],
      
      // Logging
      [/from ['"]\.\/logger['"]/g, "from '@/lib/logging/logger'"],
      [/from ['"]\.\/audit-logger['"]/g, "from '@/lib/logging/audit-logger'"],
      
      // Cache
      [/from ['"]\.\/cache['"]/g, "from '@/lib/cache/cache'"],
      [/from ['"]\.\/simple-cache['"]/g, "from '@/lib/cache/simple-cache'"],
      
      // Config
      [/from ['"]\.\/config['"]/g, "from '@/lib/config/config'"],
      [/from ['"]\.\/storage['"]/g, "from '@/lib/config/storage'"],
      
      // API
      [/from ['"]\.\/api-client['"]/g, "from '@/lib/api/api-client'"],
      [/from ['"]\.\/react-query['"]/g, "from '@/lib/api/react-query'"],
      
      // Hooks relativos
      [/from ['"]\.\.\/hooks\/use-real-time-events['"]/g, "from '@/hooks/use-real-time-events'"],
      
      // Utils
      [/from ['"]\.\/error-handler['"]/g, "from '@/lib/utils/error-handler'"],
      [/from ['"]\.\/debug['"]/g, "from '@/lib/utils/debug'"],
    ];
    
    for (const [pattern, replacement] of fixes) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${path.relative(srcDir, filePath)}`);
      fixed++;
    }
    
  } catch (error) {
    // Ignorar erros
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next'].includes(file)) {
        walkDir(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(filePath);
    }
  }
}

walkDir(srcDir);

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Arquivos corrigidos: ${fixed}`);
console.log('\n');

/**
 * Script de Validação do Sistema
 * Verifica se todas as mudanças estão corretas
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando validação do sistema...\n');

let errors = 0;
let warnings = 0;
let success = 0;

// Função auxiliar para verificar arquivo
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    success++;
    return true;
  } else {
    console.log(`❌ ${description} - ARQUIVO NÃO ENCONTRADO`);
    errors++;
    return false;
  }
}

// Função para verificar conteúdo do arquivo
function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${description}`);
      success++;
      return true;
    } else {
      console.log(`⚠️  ${description} - CONTEÚDO NÃO ENCONTRADO`);
      warnings++;
      return false;
    }
  } else {
    console.log(`❌ ${description} - ARQUIVO NÃO ENCONTRADO`);
    errors++;
    return false;
  }
}

console.log('📁 Verificando arquivos de configuração...\n');

// Verificar configurações
checkFileContent('next.config.js', 'async_hooks: false', 'Webpack configurado com async_hooks');
checkFileContent('next.config.js', 'crypto: false', 'Webpack configurado com crypto');

console.log('\n🔐 Verificando autenticação...\n');

// Verificar autenticação
checkFile('src/lib/auth.ts', 'Configuração do NextAuth');
checkFile('src/app/api/auth/[...nextauth]/route.ts', 'Rota de autenticação');
checkFile('src/providers/auth-provider.tsx', 'Provider de autenticação');
checkFileContent('src/app/layout.tsx', 'AuthProvider', 'AuthProvider no layout');

console.log('\n🔌 Verificando API Routes...\n');

// Verificar API routes
checkFile('src/app/api/transactions/route.ts', 'Rota de transações');
checkFile('src/app/api/credit-cards/route.ts', 'Rota de cartões');
checkFile('src/app/api/accounts/route.ts', 'Rota de contas');

console.log('\n🎨 Verificando componentes...\n');

// Verificar componentes
checkFile('src/components/modals/transactions/add-transaction-modal.tsx', 'Modal de transação');
checkFileContent(
  'src/components/modals/transactions/add-transaction-modal.tsx',
  'creditCards',
  'Modal carrega cartões de crédito'
);

console.log('\n🪝 Verificando hooks...\n');

// Verificar hooks
checkFile('src/hooks/use-transaction-services.ts', 'Hook de transações');
checkFileContent(
  'src/hooks/use-transaction-services.ts',
  'fetch',
  'Hook usa API routes'
);

console.log('\n📊 Verificando banco de dados...\n');

// Verificar Prisma
checkFile('prisma/schema.prisma', 'Schema do Prisma');
checkFile('prisma/dev.db', 'Banco de dados SQLite');

console.log('\n' + '='.repeat(50));
console.log('📈 RESUMO DA VALIDAÇÃO');
console.log('='.repeat(50));
console.log(`✅ Sucessos: ${success}`);
console.log(`⚠️  Avisos: ${warnings}`);
console.log(`❌ Erros: ${errors}`);
console.log('='.repeat(50));

if (errors > 0) {
  console.log('\n❌ VALIDAÇÃO FALHOU - Corrija os erros acima');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  VALIDAÇÃO COM AVISOS - Verifique os avisos acima');
  process.exit(0);
} else {
  console.log('\n✅ VALIDAÇÃO COMPLETA - Sistema OK!');
  process.exit(0);
}

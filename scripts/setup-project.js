#!/usr/bin/env node

/**
 * Script de Setup Completo do Projeto
 * Configura tudo automaticamente para novos desenvolvedores
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    return false;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  log('\n🚀 Setup do SuaGrana - Sistema Financeiro Inteligente\n', 'cyan');
  log('Este script vai configurar tudo automaticamente!\n', 'blue');

  // 1. Verificar Node.js
  log('1️⃣  Verificando Node.js...', 'yellow');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 18) {
    log(`❌ Node.js ${nodeVersion} detectado. Versão mínima: 18.0.0`, 'red');
    log('Por favor, atualize o Node.js: https://nodejs.org', 'yellow');
    process.exit(1);
  }
  log(`✅ Node.js ${nodeVersion} OK\n`, 'green');

  // 2. Instalar dependências
  log('2️⃣  Instalando dependências...', 'yellow');
  const installSuccess = exec('npm install');
  if (!installSuccess) {
    log('❌ Erro ao instalar dependências', 'red');
    process.exit(1);
  }
  log('✅ Dependências instaladas\n', 'green');

  // 3. Configurar .env
  log('3️⃣  Configurando variáveis de ambiente...', 'yellow');
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Arquivo .env.local criado', 'green');
    } else {
      // Criar .env.local básico
      const envContent = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/suagrana"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret"

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN=""

# Analytics (opcional)
NEXT_PUBLIC_GA_ID=""
`;
      fs.writeFileSync(envPath, envContent);
      log('✅ Arquivo .env.local criado com valores padrão', 'green');
    }
    
    log('\n⚠️  IMPORTANTE: Configure as variáveis em .env.local', 'yellow');
    const editNow = await question('Deseja editar agora? (s/n): ');
    
    if (editNow.toLowerCase() === 's') {
      log('\nAbra o arquivo .env.local e configure:', 'cyan');
      log('- DATABASE_URL: URL do PostgreSQL', 'cyan');
      log('- NEXTAUTH_SECRET: Gere com: openssl rand -base64 32', 'cyan');
      await question('\nPressione Enter quando terminar...');
    }
  } else {
    log('✅ Arquivo .env.local já existe\n', 'green');
  }

  // 4. Verificar PostgreSQL
  log('4️⃣  Verificando PostgreSQL...', 'yellow');
  const hasPostgres = await question('PostgreSQL está instalado e rodando? (s/n): ');
  
  if (hasPostgres.toLowerCase() === 's') {
    log('✅ PostgreSQL OK\n', 'green');
    
    // 5. Executar migrations
    log('5️⃣  Executando migrations...', 'yellow');
    const runMigrations = await question('Executar migrations agora? (s/n): ');
    
    if (runMigrations.toLowerCase() === 's') {
      const migrateSuccess = exec('npm run db:migrate');
      if (migrateSuccess) {
        log('✅ Migrations executadas\n', 'green');
      } else {
        log('⚠️  Erro ao executar migrations. Execute manualmente: npm run db:migrate\n', 'yellow');
      }
    }
  } else {
    log('⚠️  Instale PostgreSQL: https://www.postgresql.org/download/', 'yellow');
    log('Depois execute: npm run db:migrate\n', 'yellow');
  }

  // 6. Executar testes
  log('6️⃣  Verificando testes...', 'yellow');
  const runTests = await question('Executar testes agora? (s/n): ');
  
  if (runTests.toLowerCase() === 's') {
    const testSuccess = exec('npm test -- --passWithNoTests');
    if (testSuccess) {
      log('✅ Testes OK\n', 'green');
    } else {
      log('⚠️  Alguns testes falharam. Revise e corrija.\n', 'yellow');
    }
  }

  // 7. Criar dados de exemplo
  log('7️⃣  Dados de exemplo...', 'yellow');
  const seedData = await question('Criar dados de exemplo? (s/n): ');
  
  if (seedData.toLowerCase() === 's') {
    const seedSuccess = exec('npm run db:seed');
    if (seedSuccess) {
      log('✅ Dados de exemplo criados\n', 'green');
    } else {
      log('⚠️  Erro ao criar dados. Execute manualmente: npm run db:seed\n', 'yellow');
    }
  }

  // 8. Resumo final
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ SETUP CONCLUÍDO COM SUCESSO!', 'green');
  log('='.repeat(60) + '\n', 'cyan');

  log('📚 Próximos passos:', 'blue');
  log('1. Configure .env.local com suas credenciais', 'cyan');
  log('2. Execute: npm run dev', 'cyan');
  log('3. Acesse: http://localhost:3000', 'cyan');
  log('4. Leia: GUIA-COMPLETO-USUARIO.md\n', 'cyan');

  log('🎯 Comandos úteis:', 'blue');
  log('npm run dev          - Iniciar servidor', 'cyan');
  log('npm test             - Executar testes', 'cyan');
  log('npm run db:studio    - Abrir Prisma Studio', 'cyan');
  log('npm run audit        - Executar auditoria\n', 'cyan');

  log('📖 Documentação:', 'blue');
  log('GUIA-COMPLETO-USUARIO.md    - Para usuários', 'cyan');
  log('GUIA-DESENVOLVIMENTO.md     - Para desenvolvedores', 'cyan');
  log('README.md                   - Visão geral\n', 'cyan');

  log('🎉 Bem-vindo ao SuaGrana! Bom desenvolvimento!\n', 'green');

  rl.close();
}

main().catch((error) => {
  log(`\n❌ Erro: ${error.message}`, 'red');
  process.exit(1);
});

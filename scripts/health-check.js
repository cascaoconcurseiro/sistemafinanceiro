#!/usr/bin/env node

/**
 * Health Check - Verifica saúde do sistema
 * Detecta problemas antes que afetem usuários
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

class HealthChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  addIssue(message) {
    this.issues.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addPassed(message) {
    this.passed.push(message);
  }

  // 1. Verificar Node.js
  checkNodeVersion() {
    log('\n🔍 Verificando Node.js...', 'cyan');
    
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    
    if (major < 18) {
      this.addIssue(`Node.js ${version} (mínimo: 18.0.0)`);
      log(`❌ Node.js ${version} - Versão muito antiga`, 'red');
    } else {
      this.addPassed(`Node.js ${version}`);
      log(`✅ Node.js ${version}`, 'green');
    }
  }

  // 2. Verificar dependências
  checkDependencies() {
    log('\n🔍 Verificando dependências...', 'cyan');
    
    const packageJson = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJson)) {
      this.addIssue('package.json não encontrado');
      log('❌ package.json não encontrado', 'red');
      return;
    }

    const nodeModules = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(nodeModules)) {
      this.addIssue('node_modules não encontrado - Execute: npm install');
      log('❌ node_modules não encontrado', 'red');
      return;
    }

    this.addPassed('Dependências instaladas');
    log('✅ Dependências instaladas', 'green');
  }

  // 3. Verificar .env
  checkEnvFile() {
    log('\n🔍 Verificando .env...', 'cyan');
    
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      this.addWarning('.env.local não encontrado');
      log('⚠️  .env.local não encontrado', 'yellow');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar variáveis críticas
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=""`)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      this.addWarning(`Variáveis não configuradas: ${missingVars.join(', ')}`);
      log(`⚠️  Variáveis não configuradas: ${missingVars.join(', ')}`, 'yellow');
    } else {
      this.addPassed('.env.local configurado');
      log('✅ .env.local configurado', 'green');
    }
  }

  // 4. Verificar TypeScript
  checkTypeScript() {
    log('\n🔍 Verificando TypeScript...', 'cyan');
    
    const result = exec('npx tsc --noEmit');
    
    if (result === null) {
      this.addIssue('Erros de TypeScript detectados');
      log('❌ Erros de TypeScript detectados', 'red');
      log('Execute: npx tsc --noEmit para ver detalhes', 'yellow');
    } else {
      this.addPassed('TypeScript OK');
      log('✅ TypeScript OK', 'green');
    }
  }

  // 5. Verificar ESLint
  checkESLint() {
    log('\n🔍 Verificando ESLint...', 'cyan');
    
    const result = exec('npm run lint');
    
    if (result === null) {
      this.addWarning('Avisos de ESLint detectados');
      log('⚠️  Avisos de ESLint detectados', 'yellow');
    } else {
      this.addPassed('ESLint OK');
      log('✅ ESLint OK', 'green');
    }
  }

  // 6. Verificar testes
  checkTests() {
    log('\n🔍 Verificando testes...', 'cyan');
    
    const result = exec('npm test -- --passWithNoTests --silent');
    
    if (result === null) {
      this.addIssue('Testes falhando');
      log('❌ Testes falhando', 'red');
      log('Execute: npm test para ver detalhes', 'yellow');
    } else {
      this.addPassed('Testes passando');
      log('✅ Testes passando', 'green');
    }
  }

  // 7. Verificar build
  checkBuild() {
    log('\n🔍 Verificando build...', 'cyan');
    
    log('⏳ Executando build (pode demorar)...', 'yellow');
    const result = exec('npm run build');
    
    if (result === null) {
      this.addIssue('Build falhando');
      log('❌ Build falhando', 'red');
    } else {
      this.addPassed('Build OK');
      log('✅ Build OK', 'green');
    }
  }

  // 8. Verificar arquivos críticos
  checkCriticalFiles() {
    log('\n🔍 Verificando arquivos críticos...', 'cyan');
    
    const criticalFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      'prisma/schema.prisma',
      'src/app/layout.tsx',
      'src/lib/utils.ts',
    ];

    const missing = [];
    criticalFiles.forEach(file => {
      if (!fs.existsSync(path.join(process.cwd(), file))) {
        missing.push(file);
      }
    });

    if (missing.length > 0) {
      this.addIssue(`Arquivos faltando: ${missing.join(', ')}`);
      log(`❌ Arquivos faltando: ${missing.join(', ')}`, 'red');
    } else {
      this.addPassed('Todos arquivos críticos presentes');
      log('✅ Todos arquivos críticos presentes', 'green');
    }
  }

  // 9. Verificar segurança
  checkSecurity() {
    log('\n🔍 Verificando segurança...', 'cyan');
    
    const result = exec('npm audit --audit-level=high');
    
    if (result === null) {
      this.addWarning('Vulnerabilidades de segurança detectadas');
      log('⚠️  Vulnerabilidades detectadas', 'yellow');
      log('Execute: npm audit para ver detalhes', 'yellow');
      log('Execute: npm audit fix para corrigir', 'yellow');
    } else {
      this.addPassed('Sem vulnerabilidades críticas');
      log('✅ Sem vulnerabilidades críticas', 'green');
    }
  }

  // 10. Verificar performance
  checkPerformance() {
    log('\n🔍 Verificando performance...', 'cyan');
    
    // Verificar tamanho do bundle
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      const stats = this.getDirSize(nextDir);
      const sizeMB = (stats / 1024 / 1024).toFixed(2);
      
      if (sizeMB > 100) {
        this.addWarning(`Bundle muito grande: ${sizeMB}MB`);
        log(`⚠️  Bundle grande: ${sizeMB}MB`, 'yellow');
      } else {
        this.addPassed(`Bundle: ${sizeMB}MB`);
        log(`✅ Bundle: ${sizeMB}MB`, 'green');
      }
    } else {
      log('⏭️  Build não encontrado (execute npm run build)', 'yellow');
    }
  }

  getDirSize(dirPath) {
    let size = 0;
    
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += this.getDirSize(filePath);
      } else {
        size += stats.size;
      }
    });
    
    return size;
  }

  // Executar todos os checks
  async runAll() {
    log('\n' + '='.repeat(60), 'cyan');
    log('🏥 HEALTH CHECK - SuaGrana', 'cyan');
    log('='.repeat(60), 'cyan');

    this.checkNodeVersion();
    this.checkDependencies();
    this.checkEnvFile();
    this.checkCriticalFiles();
    this.checkTypeScript();
    this.checkESLint();
    this.checkTests();
    this.checkSecurity();
    this.checkPerformance();
    // this.checkBuild(); // Comentado por ser demorado

    this.printReport();
  }

  // Imprimir relatório
  printReport() {
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 RELATÓRIO DE SAÚDE', 'cyan');
    log('='.repeat(60), 'cyan');

    log(`\n✅ Passou: ${this.passed.length}`, 'green');
    log(`⚠️  Avisos: ${this.warnings.length}`, 'yellow');
    log(`❌ Erros: ${this.issues.length}`, 'red');

    if (this.issues.length > 0) {
      log('\n❌ ERROS CRÍTICOS:', 'red');
      this.issues.forEach((issue, i) => {
        log(`${i + 1}. ${issue}`, 'red');
      });
    }

    if (this.warnings.length > 0) {
      log('\n⚠️  AVISOS:', 'yellow');
      this.warnings.forEach((warning, i) => {
        log(`${i + 1}. ${warning}`, 'yellow');
      });
    }

    log('\n' + '='.repeat(60), 'cyan');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      log('✅ SISTEMA SAUDÁVEL! Tudo funcionando perfeitamente!', 'green');
    } else if (this.issues.length === 0) {
      log('✅ SISTEMA OK! Apenas avisos menores.', 'green');
    } else {
      log('❌ ATENÇÃO! Corrija os erros críticos.', 'red');
    }
    
    log('='.repeat(60) + '\n', 'cyan');

    // Exit code
    process.exit(this.issues.length > 0 ? 1 : 0);
  }
}

// Executar
const checker = new HealthChecker();
checker.runAll();

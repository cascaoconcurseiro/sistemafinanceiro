#!/usr/bin/env node

/**
 * Script para executar testes do Build Configuration Manager
 */

const { spawn } = require('child_process');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log(colorize('🧪 Executando Testes do Build Configuration Manager', 'bold'));
console.log('');

// Verificar se Jest está instalado
const testCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const testArgs = ['jest', 'tests/build-config.test.js', '--verbose'];

const testProcess = spawn(testCommand, testArgs, {
  stdio: 'inherit',
  cwd: process.cwd()
});

testProcess.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log(colorize('✅ Todos os testes passaram!', 'green'));
    console.log(colorize('🎉 Build Configuration Manager está funcionando corretamente.', 'blue'));
  } else {
    console.log(colorize('❌ Alguns testes falharam.', 'red'));
    console.log(colorize('⚠️ Verifique os erros acima e corrija os problemas.', 'yellow'));
  }
  
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error(colorize('❌ Erro ao executar testes:', 'red'), error.message);
  
  if (error.code === 'ENOENT') {
    console.log('');
    console.log(colorize('💡 Dica: Instale o Jest para executar os testes:', 'yellow'));
    console.log('   npm install --save-dev jest');
  }
  
  process.exit(1);
});
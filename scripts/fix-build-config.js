#!/usr/bin/env node

/**
 * Script para detectar e corrigir problemas de configuração de build
 * 
 * Uso:
 * node scripts/fix-build-config.js --check    # Apenas verificar problemas
 * node scripts/fix-build-config.js --fix     # Corrigir automaticamente
 * node scripts/fix-build-config.js --report  # Gerar relatório completo
 */

const { BuildConfigManager } = require('./build-config-manager.js');
const path = require('path');

// Cores para output no terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`  ${title}`, 'bold'));
  console.log(colorize('='.repeat(60), 'cyan') + '\n');
}

function printIssue(issue, index) {
  const icon = issue.type === 'error' ? '❌' : '⚠️';
  const color = issue.type === 'error' ? 'red' : 'yellow';
  
  console.log(`${icon} ${colorize(`Problema ${index + 1}:`, color)}`);
  console.log(`   ${colorize('Arquivo:', 'blue')} ${issue.file}`);
  if (issue.line) {
    console.log(`   ${colorize('Linha:', 'blue')} ${issue.line}`);
  }
  console.log(`   ${colorize('Mensagem:', 'blue')} ${issue.message}`);
  console.log(`   ${colorize('Sugestão:', 'green')} ${issue.suggestion}`);
  console.log('');
}

function printCorrection(correction, index) {
  const icon = correction.success ? '✅' : '❌';
  const color = correction.success ? 'green' : 'red';
  
  console.log(`${icon} ${colorize(`Correção ${index + 1}:`, color)}`);
  console.log(`   ${colorize('Arquivo:', 'blue')} ${correction.file}`);
  console.log(`   ${colorize('Ação:', 'blue')} ${correction.action}`);
  
  if (correction.error) {
    console.log(`   ${colorize('Erro:', 'red')} ${correction.error}`);
  }
  console.log('');
}

async function checkOnly() {
  printHeader('🔍 VERIFICAÇÃO DE COMPATIBILIDADE DE BUILD');
  
  const manager = new BuildConfigManager();
  
  try {
    const buildMode = await manager.detectBuildMode();
    console.log(`${colorize('Modo de Build Detectado:', 'blue')} ${colorize(buildMode.toUpperCase(), buildMode === 'static' ? 'yellow' : 'green')}`);
    
    const issues = await manager.validateCompatibility();
    
    if (issues.length === 0) {
      console.log(colorize('\n✅ Nenhum problema de compatibilidade encontrado!', 'green'));
      return;
    }
    
    console.log(`\n${colorize(`📋 ${issues.length} problema(s) encontrado(s):`, 'yellow')}\n`);
    
    issues.forEach((issue, index) => {
      printIssue(issue, index);
    });
    
    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;
    
    console.log(colorize('📊 RESUMO:', 'bold'));
    console.log(`   ${colorize('Erros:', 'red')} ${errors}`);
    console.log(`   ${colorize('Avisos:', 'yellow')} ${warnings}`);
    
    if (errors > 0) {
      console.log(colorize('\n💡 Execute com --fix para corrigir automaticamente', 'cyan'));
    }
    
  } catch (error) {
    console.error(colorize(`❌ Erro durante verificação: ${error}`, 'red'));
    process.exit(1);
  }
}

async function fixIssues(convertToSSR = false) {
  printHeader('🔧 CORREÇÃO AUTOMÁTICA DE PROBLEMAS');
  
  const manager = new BuildConfigManager();
  
  try {
    // Primeiro verificar problemas
    const issues = await manager.validateCompatibility();
    
    if (issues.length === 0) {
      console.log(colorize('✅ Nenhum problema encontrado para corrigir!', 'green'));
      return;
    }
    
    console.log(`${colorize(`📋 ${issues.length} problema(s) encontrado(s). Iniciando correções...`, 'yellow')}\n`);
    
    if (convertToSSR) {
      console.log(colorize('🔄 Convertendo para SSR (Server-Side Rendering)...', 'cyan'));
    }
    
    // Aplicar correções
    const corrections = await manager.autoCorrectIssues(convertToSSR);
    
    if (corrections.length === 0) {
      console.log(colorize('ℹ️ Nenhuma correção automática disponível para os problemas encontrados.', 'blue'));
      return;
    }
    
    console.log(`${colorize(`🔧 ${corrections.length} correção(ões) aplicada(s):`, 'green')}\n`);
    
    corrections.forEach((correction, index) => {
      printCorrection(correction, index);
    });
    
    const successful = corrections.filter(c => c.success).length;
    const failed = corrections.filter(c => !c.success).length;
    
    console.log(colorize('📊 RESULTADO:', 'bold'));
    console.log(`   ${colorize('Sucessos:', 'green')} ${successful}`);
    console.log(`   ${colorize('Falhas:', 'red')} ${failed}`);
    
    if (successful > 0) {
      console.log(colorize('\n✅ Correções aplicadas! Execute o build para verificar.', 'green'));
      
      if (convertToSSR) {
        console.log(colorize('🔄 Projeto convertido para SSR. Agora você pode usar todas as funcionalidades do servidor.', 'cyan'));
      }
    }
    
    if (failed > 0) {
      console.log(colorize('\n⚠️ Algumas correções falharam. Verifique os erros acima.', 'yellow'));
    }
    
  } catch (error) {
    console.error(colorize(`❌ Erro durante correção: ${error}`, 'red'));
    process.exit(1);
  }
}

async function generateReport() {
  printHeader('📊 RELATÓRIO COMPLETO DE COMPATIBILIDADE');
  
  const manager = new BuildConfigManager();
  
  try {
    const report = await manager.generateCompatibilityReport();
    
    console.log(`${colorize('Modo de Build:', 'blue')} ${colorize(report.buildMode.toUpperCase(), report.buildMode === 'static' ? 'yellow' : 'green')}`);
    
    if (report.issues.length > 0) {
      console.log(`\n${colorize(`📋 Problemas Encontrados (${report.issues.length}):`, 'yellow')}\n`);
      
      report.issues.forEach((issue, index) => {
        printIssue(issue, index);
      });
    } else {
      console.log(colorize('\n✅ Nenhum problema encontrado!', 'green'));
    }
    
    if (report.recommendations.length > 0) {
      console.log(colorize('💡 RECOMENDAÇÕES:', 'bold'));
      report.recommendations.forEach(rec => {
        console.log(`   ${colorize('•', 'cyan')} ${rec}`);
      });
    }
    
    // Gerar configuração atual
    const config = await manager.generateConfig();
    
    console.log(colorize('\n⚙️ CONFIGURAÇÃO ATUAL:', 'bold'));
    console.log(`   ${colorize('Modo:', 'blue')} ${config.mode}`);
    console.log(`   ${colorize('Rotas Dinâmicas:', 'blue')} ${config.dynamicRoutes.length}`);
    console.log(`   ${colorize('Bundle Analyzer:', 'blue')} ${config.optimizations.bundleAnalyzer ? 'Ativado' : 'Desativado'}`);
    console.log(`   ${colorize('Compressão:', 'blue')} ${config.optimizations.compression ? 'Ativada' : 'Desativada'}`);
    
    if (config.dynamicRoutes.length > 0 && config.mode === 'static') {
      console.log(colorize('\n⚠️ ATENÇÃO: Build estático com rotas dinâmicas pode falhar!', 'yellow'));
    }
    
  } catch (error) {
    console.error(colorize(`❌ Erro ao gerar relatório: ${error}`, 'red'));
    process.exit(1);
  }
}

// Processar argumentos da linha de comando
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(colorize('🔧 Fix Build Config - Ferramenta de Correção de Build', 'bold'));
    console.log('\nUso:');
    console.log('  node scripts/fix-build-config.js --check              # Verificar problemas');
    console.log('  node scripts/fix-build-config.js --fix               # Corrigir automaticamente');
    console.log('  node scripts/fix-build-config.js --fix --convert-to-ssr  # Corrigir e converter para SSR');
    console.log('  node scripts/fix-build-config.js --report            # Relatório completo');
    console.log('  node scripts/fix-build-config.js --help              # Mostrar esta ajuda');
    return;
  }
  
  if (args.includes('--check')) {
    await checkOnly();
  } else if (args.includes('--fix')) {
    const convertToSSR = args.includes('--convert-to-ssr');
    await fixIssues(convertToSSR);
  } else if (args.includes('--report')) {
    await generateReport();
  } else {
    console.error(colorize('❌ Argumento inválido. Use --help para ver as opções.', 'red'));
    process.exit(1);
  }
}

// Executar script
main().catch(error => {
  console.error(colorize(`❌ Erro fatal: ${error}`, 'red'));
  process.exit(1);
});
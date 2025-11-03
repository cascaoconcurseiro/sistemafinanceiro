#!/usr/bin/env node

/**
 * Script executável para executar auditoria completa do sistema SuaGrana
 * 
 * Uso:
 * npm run audit
 * ou
 * npx tsx src/audit/run-audit.ts
 */

import { AuditController } from './core/audit-controller';
import { AuditConfig } from './types/audit-types';
import * as path from 'path';

async function main() {
  
  console.log('=====================================\n');

  try {
    // Configuração da auditoria
    const config: Partial<AuditConfig> = {
      includeStressTests: false, // Desabilitado por padrão para MVP
      maxConcurrentUsers: 50,
      maxTransactionVolume: 1000,
      timeoutMs: 10 * 60 * 1000, // 10 minutos
      skipKnownIssues: false,
      outputFormat: 'json',
      verboseLogging: true
    };

    // Criar controlador de auditoria
    const auditController = new AuditController(config);

    

    // Executar auditoria
    const startTime = Date.now();
    const result = await auditController.executeFullAudit();
    const duration = Date.now() - startTime;

    // Exibir resultados
    console.log('\n📊 RESULTADOS DA AUDITORIA');
    console.log('=====================================');
    console.log(`Status Geral: ${getStatusEmoji(result.status)} ${result.status}`);
    console.log(`Score Geral: ${result.overallScore.toFixed(1)}%`);
    console.log(`Issues Encontrados: ${result.issuesFound}`);
    console.log(`Issues Críticos: ${result.criticalIssues}`);
    console.log(`Tempo de Execução: ${(duration / 1000).toFixed(1)}s`);
    console.log('');

    // Exibir scores por módulo
    console.log('📈 SCORES POR MÓDULO');
    console.log('-------------------------------------');
    console.log(`🔐 Segurança: ${result.securityReport.score.toFixed(1)}% (${result.securityReport.authenticationStatus})`);
    console.log(`📝 Qualidade: ${result.codeQualityReport.qualityScore.toFixed(1)}%`);
    console.log(`⚡ Performance: ${result.performanceReport.score.toFixed(1)}%`);
    console.log(`🧮 Integridade: ${result.dataIntegrityReport.score.toFixed(1)}%`);
    if (config.includeStressTests) {
      console.log(`🔥 Estresse: ${result.stressTestReport.stabilityScore.toFixed(1)}%`);
    }
    console.log('');

    // Exibir problemas críticos
    if (result.securityReport.vulnerabilities.length > 0) {
      console.log('🚨 VULNERABILIDADES DE SEGURANÇA');
      console.log('-------------------------------------');
      result.securityReport.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. [${vuln.severity}] ${vuln.description}`);
        console.log(`   📍 Local: ${vuln.location}`);
        console.log(`   💡 Solução: ${vuln.solution}`);
        console.log('');
      });
    }

    // Exibir problemas de qualidade
    if (result.codeQualityReport.schemaIssues.length > 0) {
      
      console.log('-------------------------------------');
      result.codeQualityReport.schemaIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.type}] ${issue.description}`);
        console.log(`   📍 Local: ${issue.location}`);
        console.log(`   💡 Solução: ${issue.solution}`);
        console.log('');
      });
    }

    if (result.codeQualityReport.duplicatedCode.length > 0) {
      
      console.log('-------------------------------------');
      result.codeQualityReport.duplicatedCode.forEach((dup, index) => {
        console.log(`${index + 1}. [${dup.type}] ${dup.name}`);
        console.log(`   📍 Locais: ${dup.locations.join(', ')}`);
        console.log(`   📊 Similaridade: ${dup.similarity}%`);
        console.log('');
      });
    }

    // Exibir APIs de teste
    if (result.codeQualityReport.testAPIsInProduction.length > 0) {
      console.log('🧪 APIs DE TESTE EM PRODUÇÃO');
      console.log('-------------------------------------');
      result.codeQualityReport.testAPIsInProduction.forEach((api, index) => {
        console.log(`${index + 1}. ${api}`);
      });
      console.log('');
    }

    // Exibir sumário executivo
    
    console.log('-------------------------------------');
    console.log(`Saúde Geral: ${result.executiveSummary.overallHealth}`);
    console.log(`Pronto para Produção: ${result.executiveSummary.readyForProduction ? '✅ Sim' : '❌ Não'}`);
    console.log(`Nível de Risco: ${result.executiveSummary.riskLevel}`);
    console.log('');

    if (result.executiveSummary.keyFindings.length > 0) {
      
      result.executiveSummary.keyFindings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding}`);
      });
      console.log('');
    }

    if (result.executiveSummary.immediateActions.length > 0) {
      console.log('⚡ AÇÕES IMEDIATAS:');
      result.executiveSummary.immediateActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
      });
      console.log('');
    }

    // Salvar relatório detalhado
    const reportPath = path.join(process.cwd(), `audit-report-${result.id}.json`);
    const fs = await import('fs/promises');
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
    console.log(`📄 Relatório detalhado salvo em: ${reportPath}`);

    // Exibir logs se houver erros
    const logsSummary = auditController.getLogsSummary();
    if (logsSummary.errors.length > 0) {
      console.log('\n❌ ERROS DURANTE A AUDITORIA');
      console.log('-------------------------------------');
      logsSummary.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.module}] ${error.message}`);
        if (error.error) {
          console.log(`   Erro: ${error.error.message}`);
        }
      });
    }

    // Código de saída baseado no resultado
    if (result.status === 'CRITICAL') {
      console.log('\n🚫 AUDITORIA FALHOU - Sistema não deve ir para produção');
      process.exit(1);
    } else if (result.status === 'FAIL') {
      console.log('\n⚠️ AUDITORIA COM PROBLEMAS - Correções necessárias');
      process.exit(1);
    } else if (result.status === 'WARNING') {
      console.log('\n⚠️ AUDITORIA COM AVISOS - Melhorias recomendadas');
      process.exit(0);
    } else {
      console.log('\n✅ AUDITORIA PASSOU - Sistema aprovado');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL NA AUDITORIA');
    console.error('=====================================');
    console.error(error);
    process.exit(1);
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'PASS': return '✅';
    case 'WARNING': return '⚠️';
    case 'FAIL': return '❌';
    case 'CRITICAL': return '🚨';
    default: return '❓';
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as runAudit };
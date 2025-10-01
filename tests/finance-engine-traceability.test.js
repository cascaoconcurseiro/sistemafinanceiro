/**
 * 🔒 TESTES DE RASTREABILIDADE - Finance Engine
 * 
 * OBJETIVO: Verificar que todos os hooks importam dados APENAS do finance-engine
 * RESULTADO: Testes quebram se houver outro caminho de importação
 * 
 * Estes testes garantem que a arquitetura seja respeitada e que não existam
 * cálculos paralelos ou importações diretas de contextos financeiros.
 */

const fs = require('fs');
const path = require('path');

describe('🔒 Finance Engine Traceability Tests', () => {
  const hooksDir = path.join(__dirname, '../src/hooks');
  const financeEngineImports = [
    'getSaldoGlobal',
    'getRelatorioMensal', 
    'getTransacoesPorConta',
    'getResumoCategorias'
  ];

  // Hooks que DEVEM usar apenas finance-engine
  const criticalHooks = [
    'useDashboardData.ts',
    'use-reports.ts',
    'useAccounts.ts',
    'useFinancialMetrics.ts',
    'useCashFlow.ts',
    'useTransactions.ts'
  ];

  // Importações PROIBIDAS (contextos que fazem cálculos)
  const prohibitedImports = [
    'unified-context',
    'useUnified',
    'useFinancialMetrics',
    'useReportsData',
    'useTransactionContext',
    'useAccountContext'
  ];

  // Padrões de código PROIBIDOS
  const prohibitedPatterns = [
    /\.reduce\s*\(/g,
    /\.map\s*\(/g,
    /\.filter\s*\(/g,
    /transactions\s*\.\s*(reduce|map|filter)/g,
    /amount\s*[\+\-\*\/]/g,
    /balance\s*[\+\-\*\/]/g,
    /Math\.(sum|abs|round|floor|ceil)\s*\(/g
  ];

  function readFileContent(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  function checkFinanceEngineImports(content, hookName) {
    const hasFinanceEngineImport = content.includes('core/finance-engine') || 
                                   content.includes('finance-engine');
    
    const hasFinanceEngineFunctions = financeEngineImports.some(func => 
      content.includes(func)
    );

    return {
      hasCorrectImport: hasFinanceEngineImport,
      hasFunctions: hasFinanceEngineFunctions,
      hookName
    };
  }

  function checkProhibitedImports(content, hookName) {
    const violations = [];
    
    prohibitedImports.forEach(importName => {
      if (content.includes(importName)) {
        violations.push({
          type: 'prohibited_import',
          import: importName,
          hookName
        });
      }
    });

    return violations;
  }

  function checkProhibitedPatterns(content, hookName) {
    const violations = [];
    
    prohibitedPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'prohibited_pattern',
            pattern: pattern.toString(),
            match: match,
            hookName
          });
        });
      }
    });

    return violations;
  }

  describe('Verificação de Importações Corretas', () => {
    criticalHooks.forEach(hookFile => {
      test(`🔍 ${hookFile} deve importar APENAS do finance-engine`, () => {
        const hookPath = path.join(hooksDir, hookFile);
        const content = readFileContent(hookPath);
        
        if (!content) {
          console.warn(`⚠️  Hook ${hookFile} não encontrado, pulando teste`);
          return;
        }

        const importCheck = checkFinanceEngineImports(content, hookFile);
        
        expect(importCheck.hasCorrectImport).toBe(true);
        expect(importCheck.hasFunctions).toBe(true);
        
        if (!importCheck.hasCorrectImport) {
          throw new Error(
            `🚨 VIOLAÇÃO CRÍTICA: ${hookFile} não importa do finance-engine!\n` +
            `Todos os hooks devem usar getSaldoGlobal(), getRelatorioMensal(), etc.`
          );
        }
      });
    });
  });

  describe('Verificação de Importações Proibidas', () => {
    criticalHooks.forEach(hookFile => {
      test(`🚫 ${hookFile} NÃO deve importar contextos financeiros diretos`, () => {
        const hookPath = path.join(hooksDir, hookFile);
        const content = readFileContent(hookPath);
        
        if (!content) {
          console.warn(`⚠️  Hook ${hookFile} não encontrado, pulando teste`);
          return;
        }

        const violations = checkProhibitedImports(content, hookFile);
        
        if (violations.length > 0) {
          const violationDetails = violations.map(v => 
            `  - Importação proibida: ${v.import}`
          ).join('\n');
          
          throw new Error(
            `🚨 VIOLAÇÃO CRÍTICA: ${hookFile} usa importações proibidas!\n` +
            violationDetails + '\n' +
            `Use apenas funções do finance-engine: getSaldoGlobal(), getRelatorioMensal(), etc.`
          );
        }
        
        expect(violations).toHaveLength(0);
      });
    });
  });

  describe('Verificação de Padrões de Código Proibidos', () => {
    criticalHooks.forEach(hookFile => {
      test(`⚡ ${hookFile} NÃO deve conter cálculos financeiros diretos`, () => {
        const hookPath = path.join(hooksDir, hookFile);
        const content = readFileContent(hookPath);
        
        if (!content) {
          console.warn(`⚠️  Hook ${hookFile} não encontrado, pulando teste`);
          return;
        }

        const violations = checkProhibitedPatterns(content, hookFile);
        
        if (violations.length > 0) {
          const violationDetails = violations.map(v => 
            `  - Padrão proibido: ${v.match} (${v.pattern})`
          ).join('\n');
          
          throw new Error(
            `🚨 VIOLAÇÃO CRÍTICA: ${hookFile} contém cálculos financeiros diretos!\n` +
            violationDetails + '\n' +
            `Todos os cálculos devem estar no finance-engine.`
          );
        }
        
        expect(violations).toHaveLength(0);
      });
    });
  });

  describe('Verificação de Arquitetura Global', () => {
    test('🏗️  Todos os hooks críticos devem existir e seguir a arquitetura', () => {
      const existingHooks = [];
      const missingHooks = [];
      
      criticalHooks.forEach(hookFile => {
        const hookPath = path.join(hooksDir, hookFile);
        if (fs.existsSync(hookPath)) {
          existingHooks.push(hookFile);
        } else {
          missingHooks.push(hookFile);
        }
      });

      console.log(`✅ Hooks encontrados: ${existingHooks.length}`);
      console.log(`❌ Hooks ausentes: ${missingHooks.length}`);
      
      if (missingHooks.length > 0) {
        console.warn(`⚠️  Hooks ausentes: ${missingHooks.join(', ')}`);
      }

      // Pelo menos 50% dos hooks críticos devem existir
      expect(existingHooks.length).toBeGreaterThanOrEqual(Math.ceil(criticalHooks.length * 0.5));
    });

    test('🔍 Finance-engine deve existir e ter as funções obrigatórias', () => {
      const financeEnginePath = path.join(__dirname, '../src/core/finance-engine/index.ts');
      const content = readFileContent(financeEnginePath);
      
      expect(content).toBeTruthy();
      
      financeEngineImports.forEach(func => {
        expect(content).toContain(`export function ${func}`);
      });
    });
  });

  describe('Verificação de Integridade do Sistema', () => {
    test('🛡️  Nenhum arquivo fora do finance-engine deve fazer cálculos financeiros', () => {
      const srcDir = path.join(__dirname, '../src');
      const violations = [];

      function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // Pular o diretório finance-engine
            if (!filePath.includes('finance-engine')) {
              scanDirectory(filePath);
            }
          } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            // Pular arquivos do finance-engine
            if (!filePath.includes('finance-engine')) {
              const content = readFileContent(filePath);
              const fileViolations = checkProhibitedPatterns(content, file);
              violations.push(...fileViolations);
            }
          }
        });
      }

      scanDirectory(srcDir);

      if (violations.length > 0) {
        const violationSummary = violations.slice(0, 10).map(v => 
          `  - ${v.hookName}: ${v.match}`
        ).join('\n');
        
        throw new Error(
          `🚨 VIOLAÇÃO CRÍTICA: Encontrados ${violations.length} cálculos financeiros fora do finance-engine!\n` +
          violationSummary + 
          (violations.length > 10 ? '\n  ... e mais violações' : '') + '\n' +
          `Todos os cálculos devem estar centralizados no finance-engine.`
        );
      }
      
      expect(violations).toHaveLength(0);
    });
  });
});
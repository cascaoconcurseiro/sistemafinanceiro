/**
 * Code Quality Auditor - Módulo de auditoria de qualidade de código
 * 
 * Responsável por:
 * - Analisar schema Prisma para detectar duplicações
 * - Detectar funções duplicadas em componentes React
 * - Validar sintaxe SQL para SQLite
 * - Identificar APIs de teste em produção
 * - Verificar consistência de nomenclatura
 */

import { AuditLogger } from '../utils/audit-logger';
import { 
  CodeQualityReport, 
  SchemaIssue, 
  CodeDuplication, 
  SQLError, 
  NamingIssue,
  TechnicalDebtMetric 
} from '../types/report-types';
import { QualityIssue, IssueFactory } from '../types/issue-types';
import { IssueSeverity, CodeLocation } from '../types/audit-types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CodeQualityAuditor {
  private logger: AuditLogger;
  private projectRoot: string;

  constructor(logger: AuditLogger, projectRoot: string = process.cwd()) {
    this.logger = logger;
    this.projectRoot = projectRoot;
  }

  async executeCodeQualityAudit(): Promise<CodeQualityReport> {
    this.logger.auditStart('CodeQualityAuditor', 'CompleteCodeQualityAudit');

    const report: CodeQualityReport = {
      schemaIssues: [],
      duplicatedCode: [],
      sqlErrors: [],
      testAPIsInProduction: [],
      namingInconsistencies: [],
      qualityScore: 0,
      technicalDebt: [],
      maintainabilityIndex: 0
    };

    try {
      // 1. Analisar schema Prisma
      await this.analyzePrismaSchema(report);

      // 2. Detectar código duplicado
      await this.detectDuplicatedCode(report);

      // 3. Validar sintaxe SQL
      await this.validateSQLSyntax(report);

      // 4. Identificar APIs de teste
      await this.identifyTestAPIs(report);

      // 5. Verificar consistência de nomenclatura
      await this.checkNamingConsistency(report);

      // 6. Calcular métricas de qualidade
      await this.calculateQualityMetrics(report);

      this.logger.auditComplete('CodeQualityAuditor', 'CompleteCodeQualityAudit', 
        report.schemaIssues.length + report.duplicatedCode.length + report.sqlErrors.length);

      return report;

    } catch (error) {
      this.logger.auditError('CodeQualityAuditor', 'CompleteCodeQualityAudit', error as Error);
      throw error;
    }
  }

  private async analyzePrismaSchema(report: CodeQualityReport): Promise<void> {
    this.logger.info('CodeQualityAuditor', '📋 Analisando schema Prisma');

    try {
      const schemaPath = path.join(this.projectRoot, 'prisma/schema.prisma');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');

      // Detectar modelos duplicados
      const modelMatches = schemaContent.match(/model\s+(\w+)\s*{/g);
      if (modelMatches) {
        const modelNames: Record<string, number> = {};
        const modelPositions: Record<string, number[]> = {};

        modelMatches.forEach((match, index) => {
          const modelName = match.match(/model\s+(\w+)/)?.[1];
          if (modelName) {
            modelNames[modelName] = (modelNames[modelName] || 0) + 1;
            if (!modelPositions[modelName]) {
              modelPositions[modelName] = [];
            }
            modelPositions[modelName].push(index);
          }
        });

        // Reportar duplicações
        for (const [modelName, count] of Object.entries(modelNames)) {
          if (count > 1) {
            const issue: SchemaIssue = {
              type: 'DUPLICATE_MODEL',
              modelName,
              description: `Modelo '${modelName}' está definido ${count} vezes no schema`,
              location: 'prisma/schema.prisma',
              impact: 'Erro de compilação do Prisma, sistema não funciona',
              solution: `Manter apenas uma definição do modelo '${modelName}'`
            };

            report.schemaIssues.push(issue);
            this.logger.issueDetected('CodeQualityAuditor', 'DUPLICATE_MODEL', 'CRITICAL', `${modelName}`);
          }
        }
      }

      // Verificar relacionamentos inconsistentes
      await this.checkSchemaRelationships(schemaContent, report);

      // Verificar mapeamento de campos inconsistente
      await this.checkFieldMapping(schemaContent, report);

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        this.logger.warn('CodeQualityAuditor', 'Schema Prisma não encontrado');
      } else {
        this.logger.error('CodeQualityAuditor', 'Erro ao analisar schema Prisma', error as Error);
      }
    }
  }

  private async checkSchemaRelationships(schemaContent: string, report: CodeQualityReport): Promise<void> {
    // Verificar se relacionamentos estão consistentes
    const relationMatches = schemaContent.match(/@relation\([^)]*\)/g);
    if (relationMatches) {
      for (const relation of relationMatches) {
        // Verificar se fields e references estão balanceados
        const fieldsMatch = relation.match(/fields:\s*\[([^\]]*)\]/);
        const referencesMatch = relation.match(/references:\s*\[([^\]]*)\]/);

        if (fieldsMatch && referencesMatch) {
          const fields = fieldsMatch[1].split(',').map(f => f.trim());
          const references = referencesMatch[1].split(',').map(r => r.trim());

          if (fields.length !== references.length) {
            const issue: SchemaIssue = {
              type: 'INCONSISTENT_RELATION',
              modelName: 'Unknown',
              description: 'Relacionamento com número diferente de fields e references',
              location: 'prisma/schema.prisma',
              impact: 'Possível erro de relacionamento no banco de dados',
              solution: 'Verificar e corrigir relacionamentos no schema'
            };

            report.schemaIssues.push(issue);
          }
        }
      }
    }
  }

  private async checkFieldMapping(schemaContent: string, report: CodeQualityReport): Promise<void> {
    // Verificar inconsistências entre camelCase e snake_case
    const fieldMatches = schemaContent.match(/\w+\s+\w+.*@map\("([^"]+)"\)/g);
    if (fieldMatches) {
      for (const fieldMatch of fieldMatches) {
        const parts = fieldMatch.split('@map(');
        if (parts.length === 2) {
          const fieldName = parts[0].trim().split(/\s+/)[0];
          const mappedName = parts[1].match(/"([^"]+)"/)?.[1];

          if (fieldName && mappedName) {
            // Verificar se há inconsistência de nomenclatura
            const fieldIsCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(fieldName);
            const mappedIsSnakeCase = /^[a-z][a-z0-9_]*$/.test(mappedName);

            if (fieldIsCamelCase && !mappedIsSnakeCase) {
              const issue: SchemaIssue = {
                type: 'INCONSISTENT_MAPPING',
                modelName: 'Unknown',
                description: `Campo '${fieldName}' mapeado para '${mappedName}' não segue padrão snake_case`,
                location: 'prisma/schema.prisma',
                impact: 'Inconsistência de nomenclatura no banco de dados',
                solution: 'Usar snake_case para nomes de campos no banco'
              };

              report.schemaIssues.push(issue);
            }
          }
        }
      }
    }
  }

  private async detectDuplicatedCode(report: CodeQualityReport): Promise<void> {
    this.logger.info('CodeQualityAuditor', '🔍 Detectando código duplicado');

    try {
      // Procurar por funções duplicadas em componentes React
      const componentFiles = await this.findComponentFiles();

      for (const componentFile of componentFiles) {
        try {
          const content = await fs.readFile(componentFile, 'utf-8');
          const relativePath = componentFile.replace(this.projectRoot, '');

          // Detectar funções duplicadas (exemplo conhecido: handleExportBilling)
          await this.detectDuplicateFunctions(content, relativePath, report);

          // Detectar imports desnecessários
          await this.detectUnnecessaryImports(content, relativePath, report);

        } catch (error) {
          this.logger.warn('CodeQualityAuditor', `Erro ao analisar ${componentFile}: ${error}`);
        }
      }

    } catch (error) {
      this.logger.error('CodeQualityAuditor', 'Erro ao detectar código duplicado', error as Error);
    }
  }

  private async detectDuplicateFunctions(content: string, filePath: string, report: CodeQualityReport): Promise<void> {
    // Procurar por definições de função
    const functionMatches = content.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g);
    if (functionMatches) {
      const functionNames: Record<string, number> = {};
      const functionPositions: Record<string, { line: number; match: string }[]> = {};

      functionMatches.forEach((match, index) => {
        const functionName = match.match(/const\s+(\w+)/)?.[1];
        if (functionName) {
          functionNames[functionName] = (functionNames[functionName] || 0) + 1;
          if (!functionPositions[functionName]) {
            functionPositions[functionName] = [];
          }
          
          // Calcular linha aproximada
          const beforeMatch = content.substring(0, content.indexOf(match));
          const line = beforeMatch.split('\n').length;
          
          functionPositions[functionName].push({ line, match });
        }
      });

      // Reportar duplicações
      for (const [functionName, count] of Object.entries(functionNames)) {
        if (count > 1) {
          const positions = functionPositions[functionName];
          const duplication: CodeDuplication = {
            type: 'FUNCTION',
            name: functionName,
            locations: positions.map(p => `${filePath}:${p.line}`),
            similarity: 100, // Assumindo 100% se o nome é idêntico
            linesOfCode: this.estimateFunctionLines(positions[0].match),
            impact: 'Comportamento inconsistente, segunda definição sobrescreve a primeira'
          };

          report.duplicatedCode.push(duplication);
          this.logger.issueDetected('CodeQualityAuditor', 'DUPLICATE_FUNCTION', 'HIGH', `${functionName} in ${filePath}`);
        }
      }
    }
  }

  private async detectUnnecessaryImports(content: string, filePath: string, report: CodeQualityReport): Promise<void> {
    const importMatches = content.match(/import\s+.*from\s+['"][^'"]+['"]/g);
    if (importMatches) {
      for (const importMatch of importMatches) {
        const importedItems = this.extractImportedItems(importMatch);
        const unusedImports = importedItems.filter(item => {
          // Verificar se o item é usado no código (busca simples)
          const regex = new RegExp(`\\b${item}\\b`, 'g');
          const matches = content.match(regex);
          return !matches || matches.length <= 1; // <= 1 porque a própria declaração de import conta
        });

        if (unusedImports.length > 0) {
          // Não é crítico, mas adiciona à dívida técnica
          this.logger.debug('CodeQualityAuditor', `Possíveis imports não utilizados em ${filePath}: ${unusedImports.join(', ')}`);
        }
      }
    }
  }

  private extractImportedItems(importStatement: string): string[] {
    const items: string[] = [];
    
    // Extrair imports nomeados: import { a, b, c } from '...'
    const namedImports = importStatement.match(/{\s*([^}]+)\s*}/);
    if (namedImports) {
      const namedItems = namedImports[1].split(',').map(item => {
        // Remover alias (as newName)
        const cleanItem = item.split(' as ')[0].trim();
        return cleanItem;
      });
      items.push(...namedItems);
    }

    // Extrair import default: import Something from '...'
    const defaultImport = importStatement.match(/import\s+(\w+)\s+from/);
    if (defaultImport && !importStatement.includes('{')) {
      items.push(defaultImport[1]);
    }

    return items;
  }

  private estimateFunctionLines(functionMatch: string): number {
    // Estimativa simples baseada no tamanho da string
    return Math.max(5, Math.floor(functionMatch.length / 50));
  }

  private async validateSQLSyntax(report: CodeQualityReport): Promise<void> {
    this.logger.info('CodeQualityAuditor', '🗃️ Validando sintaxe SQL');

    try {
      const sourceFiles = await this.findSourceFiles();

      for (const sourceFile of sourceFiles) {
        try {
          const content = await fs.readFile(sourceFile, 'utf-8');
          const relativePath = sourceFile.replace(this.projectRoot, '');

          // Procurar por queries SQL raw
          const rawQueryMatches = content.match(/\$queryRaw`([^`]+)`/g);
          if (rawQueryMatches) {
            for (const queryMatch of rawQueryMatches) {
              const query = queryMatch.match(/\$queryRaw`([^`]+)`/)?.[1];
              if (query) {
                await this.validateSQLiteQuery(query, relativePath, report);
              }
            }
          }

          // Procurar por queries com sintaxe incorreta para SQLite
          if (content.includes('$queryRaw') && content.includes('${')) {
            const sqlError: SQLError = {
              query: 'Dynamic query with template literals',
              error: 'Possível sintaxe incorreta para SQLite',
              location: relativePath,
              suggestion: 'Usar Prisma.sql ou queries parametrizadas'
            };

            report.sqlErrors.push(sqlError);
            this.logger.issueDetected('CodeQualityAuditor', 'SQL_SYNTAX_ERROR', 'MEDIUM', relativePath);
          }

        } catch (error) {
          this.logger.warn('CodeQualityAuditor', `Erro ao analisar ${sourceFile}: ${error}`);
        }
      }

    } catch (error) {
      this.logger.error('CodeQualityAuditor', 'Erro ao validar sintaxe SQL', error as Error);
    }
  }

  private async validateSQLiteQuery(query: string, location: string, report: CodeQualityReport): Promise<void> {
    // Verificações básicas de sintaxe SQLite
    const commonErrors = [
      {
        pattern: /\?\s*\?/,
        error: 'Múltiplos placeholders consecutivos',
        suggestion: 'Verificar sintaxe de placeholders'
      },
      {
        pattern: /FROM\s+\${/,
        error: 'Nome de tabela dinâmico pode causar SQL injection',
        suggestion: 'Usar nomes de tabela fixos'
      },
      {
        pattern: /WHERE\s+\${/,
        error: 'Condição WHERE dinâmica pode causar SQL injection',
        suggestion: 'Usar queries parametrizadas'
      }
    ];

    for (const errorCheck of commonErrors) {
      if (errorCheck.pattern.test(query)) {
        const sqlError: SQLError = {
          query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
          error: errorCheck.error,
          location,
          suggestion: errorCheck.suggestion
        };

        report.sqlErrors.push(sqlError);
        this.logger.issueDetected('CodeQualityAuditor', 'SQL_SYNTAX_ERROR', 'HIGH', location);
      }
    }
  }

  private async identifyTestAPIs(report: CodeQualityReport): Promise<void> {
    this.logger.info('CodeQualityAuditor', '🧪 Identificando APIs de teste em produção');

    try {
      const apiDir = path.join(this.projectRoot, 'src/app/api');
      const testApiPatterns = [
        'test-',
        'debug-',
        'check-',
        '-test',
        'mock-',
        'dev-'
      ];

      const apiDirectories = await this.findDirectories(apiDir);

      for (const apiDirectory of apiDirectories) {
        const dirName = path.basename(apiDirectory);
        
        if (testApiPatterns.some(pattern => dirName.includes(pattern))) {
          const relativePath = apiDirectory.replace(this.projectRoot, '');
          report.testAPIsInProduction.push(relativePath);
          this.logger.issueDetected('CodeQualityAuditor', 'TEST_API_IN_PRODUCTION', 'MEDIUM', relativePath);
        }
      }

      // Verificar também arquivos de API com nomes de teste
      const apiFiles = await this.findApiFiles(apiDir);
      for (const apiFile of apiFiles) {
        const fileName = path.basename(path.dirname(apiFile));
        if (testApiPatterns.some(pattern => fileName.includes(pattern))) {
          const relativePath = apiFile.replace(this.projectRoot, '');
          if (!report.testAPIsInProduction.includes(relativePath)) {
            report.testAPIsInProduction.push(relativePath);
          }
        }
      }

    } catch (error) {
      this.logger.error('CodeQualityAuditor', 'Erro ao identificar APIs de teste', error as Error);
    }
  }

  private async checkNamingConsistency(report: CodeQualityReport): Promise<void> {
    this.logger.info('CodeQualityAuditor', '📝 Verificando consistência de nomenclatura');

    try {
      // Verificar consistência entre schema Prisma e código
      const schemaPath = path.join(this.projectRoot, 'prisma/schema.prisma');
      
      try {
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        
        // Extrair campos mapeados
        const mappedFields = this.extractMappedFields(schemaContent);
        
        // Verificar se o código usa os nomes corretos
        const sourceFiles = await this.findSourceFiles();
        
        for (const sourceFile of sourceFiles) {
          const content = await fs.readFile(sourceFile, 'utf-8');
          const relativePath = sourceFile.replace(this.projectRoot, '');
          
          // Procurar por uso de nomes inconsistentes
          for (const [fieldName, mappedName] of mappedFields) {
            // Se o código usa o nome do campo em vez do nome mapeado em queries
            if (content.includes(`deletedAt`) && mappedName === 'deleted_at') {
              const issue: NamingIssue = {
                type: 'SNAKE_CASE_CAMEL_CASE',
                field: fieldName,
                expected: mappedName,
                actual: 'deletedAt',
                locations: [relativePath]
              };

              report.namingInconsistencies.push(issue);
              this.logger.issueDetected('CodeQualityAuditor', 'NAMING_INCONSISTENCY', 'MEDIUM', `${fieldName} in ${relativePath}`);
            }
          }
        }

      } catch (error) {
        this.logger.warn('CodeQualityAuditor', 'Não foi possível verificar consistência com schema Prisma');
      }

    } catch (error) {
      this.logger.error('CodeQualityAuditor', 'Erro ao verificar nomenclatura', error as Error);
    }
  }

  private extractMappedFields(schemaContent: string): Map<string, string> {
    const mappedFields = new Map<string, string>();
    
    const fieldMatches = schemaContent.match(/(\w+)\s+\w+.*@map\("([^"]+)"\)/g);
    if (fieldMatches) {
      for (const match of fieldMatches) {
        const parts = match.match(/(\w+)\s+\w+.*@map\("([^"]+)"\)/);
        if (parts) {
          mappedFields.set(parts[1], parts[2]);
        }
      }
    }

    return mappedFields;
  }

  private async calculateQualityMetrics(report: CodeQualityReport): Promise<void> {
    this.logger.info('CodeQualityAuditor', '📊 Calculando métricas de qualidade');

    // Calcular score de qualidade
    let score = 100;

    // Penalizar por issues
    score -= report.schemaIssues.length * 15;
    score -= report.duplicatedCode.length * 10;
    score -= report.sqlErrors.length * 8;
    score -= report.testAPIsInProduction.length * 5;
    score -= report.namingInconsistencies.length * 3;

    report.qualityScore = Math.max(0, score);

    // Calcular dívida técnica
    const technicalDebt: TechnicalDebtMetric[] = [
      {
        category: 'Schema Issues',
        debt: report.schemaIssues.length * 2, // 2 horas por issue de schema
        interest: report.schemaIssues.length * 0.5, // 30 min por mês
        description: 'Problemas no schema Prisma que impedem compilação'
      },
      {
        category: 'Code Duplication',
        debt: report.duplicatedCode.length * 1.5, // 1.5 horas por duplicação
        interest: report.duplicatedCode.length * 0.25, // 15 min por mês
        description: 'Código duplicado que dificulta manutenção'
      },
      {
        category: 'SQL Errors',
        debt: report.sqlErrors.length * 1, // 1 hora por erro SQL
        interest: report.sqlErrors.length * 0.1, // 6 min por mês
        description: 'Erros de sintaxe SQL que podem causar falhas'
      }
    ];

    report.technicalDebt = technicalDebt;

    // Calcular índice de manutenibilidade (0-100)
    const totalDebt = technicalDebt.reduce((sum, debt) => sum + debt.debt, 0);
    report.maintainabilityIndex = Math.max(0, 100 - totalDebt);

    this.logger.performanceMetric('CodeQualityAuditor', 'QUALITY_SCORE', report.qualityScore, '%');
    this.logger.performanceMetric('CodeQualityAuditor', 'TECHNICAL_DEBT', totalDebt, 'hours');
  }

  // Métodos auxiliares
  private async findComponentFiles(): Promise<string[]> {
    const files: string[] = [];
    const componentsDir = path.join(this.projectRoot, 'src/components');
    
    try {
      await this.findFilesRecursive(componentsDir, files, /\.(tsx|jsx)$/);
    } catch {
      // Diretório pode não existir
    }

    return files;
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const srcDir = path.join(this.projectRoot, 'src');
    
    try {
      await this.findFilesRecursive(srcDir, files, /\.(ts|tsx|js|jsx)$/);
    } catch {
      // Diretório pode não existir
    }

    return files;
  }

  private async findApiFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...await this.findApiFiles(fullPath));
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          files.push(fullPath);
        }
      }
    } catch {
      // Diretório não existe ou sem permissão
    }
    
    return files;
  }

  private async findDirectories(dir: string): Promise<string[]> {
    const directories: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dir, entry.name);
          directories.push(fullPath);
          directories.push(...await this.findDirectories(fullPath));
        }
      }
    } catch {
      // Diretório não existe ou sem permissão
    }
    
    return directories;
  }

  private async findFilesRecursive(dir: string, files: string[], pattern: RegExp): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.findFilesRecursive(fullPath, files, pattern);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Diretório não existe ou sem permissão
    }
  }
}
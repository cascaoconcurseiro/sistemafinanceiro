/**
 * Security Auditor - Módulo de auditoria de segurança
 * 
 * Responsável por:
 * - Verificar configuração de autenticação NextAuth
 * - Validar hash de senhas e segurança de credenciais  
 * - Testar isolamento de dados entre usuários
 * - Identificar vulnerabilidades em endpoints de API
 * - Analisar logs para vazamento de dados sensíveis
 */

import { AuditLogger } from '../utils/audit-logger';
import { SecurityReport, SecurityVulnerability, SecurityRecommendation } from '../types/report-types';
import { SecurityIssue, IssueFactory } from '../types/issue-types';
import { IssueSeverity, CodeLocation } from '../types/audit-types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class SecurityAuditor {
  private logger: AuditLogger;
  private projectRoot: string;

  constructor(logger: AuditLogger, projectRoot: string = process.cwd()) {
    this.logger = logger;
    this.projectRoot = projectRoot;
  }

  async executeSecurityAudit(): Promise<SecurityReport> {
    this.logger.auditStart('SecurityAuditor', 'CompleteSecurityAudit');

    const report: SecurityReport = {
      authenticationStatus: 'SECURE',
      passwordCompliance: true,
      dataIsolationScore: 100,
      vulnerabilities: [],
      nextAuthSecretConfigured: false,
      apiEndpointsProtected: 100,
      dataLeakageDetected: false,
      recommendations: [],
      score: 0
    };

    try {
      // 1. Verificar configuração NextAuth
      await this.auditNextAuthConfiguration(report);

      // 2. Validar segurança de senhas
      await this.auditPasswordSecurity(report);

      // 3. Testar isolamento de dados
      await this.auditDataIsolation(report);

      // 4. Escanear vulnerabilidades de API
      await this.auditAPIVulnerabilities(report);

      // 5. Verificar vazamento de dados
      await this.auditDataLeakage(report);

      // Calcular score final
      report.score = this.calculateSecurityScore(report);

      // Determinar status geral
      report.authenticationStatus = this.determineAuthStatus(report);

      this.logger.auditComplete('SecurityAuditor', 'CompleteSecurityAudit', report.vulnerabilities.length);

      return report;

    } catch (error) {
      this.logger.auditError('SecurityAuditor', 'CompleteSecurityAudit', error as Error);
      throw error;
    }
  }

  private async auditNextAuthConfiguration(report: SecurityReport): Promise<void> {
    this.logger.info('SecurityAuditor', '🔐 Verificando configuração NextAuth');

    try {
      // Verificar se NEXTAUTH_SECRET está configurado
      const envPath = path.join(this.projectRoot, '.env');
      const envLocalPath = path.join(this.projectRoot, '.env.local');
      
      let envContent = '';
      
      try {
        envContent += await fs.readFile(envPath, 'utf-8');
      } catch {
        // .env pode não existir
      }

      try {
        envContent += await fs.readFile(envLocalPath, 'utf-8');
      } catch {
        // .env.local pode não existir
      }

      // Verificar NEXTAUTH_SECRET
      const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET') && 
                               !envContent.includes('NEXTAUTH_SECRET=""') &&
                               !envContent.includes('NEXTAUTH_SECRET=\'\'');

      report.nextAuthSecretConfigured = hasNextAuthSecret;

      if (!hasNextAuthSecret) {
        const vulnerability: SecurityVulnerability = {
          type: 'NEXTAUTH_SECRET_MISSING',
          severity: 'CRITICAL',
          description: 'NEXTAUTH_SECRET não está configurado ou está vazio',
          location: '.env ou .env.local',
          impact: 'Tokens de sessão previsíveis, comprometimento de autenticação',
          solution: 'Configurar NEXTAUTH_SECRET com pelo menos 32 caracteres aleatórios'
        };

        report.vulnerabilities.push(vulnerability);
        this.logger.issueDetected('SecurityAuditor', 'NEXTAUTH_SECRET_MISSING', 'CRITICAL', '.env');
      }

      // Verificar configuração do NextAuth
      const authConfigPath = path.join(this.projectRoot, 'src/lib/auth.ts');
      try {
        const authConfig = await fs.readFile(authConfigPath, 'utf-8');
        
        // Verificar se há configurações inseguras
        if (authConfig.includes('secret: process.env.NEXTAUTH_SECRET')) {
          this.logger.info('SecurityAuditor', '✅ NextAuth configurado corretamente');
        } else {
          const vulnerability: SecurityVulnerability = {
            type: 'NEXTAUTH_CONFIG_INSECURE',
            severity: 'HIGH',
            description: 'Configuração do NextAuth pode estar insegura',
            location: 'src/lib/auth.ts',
            impact: 'Possível comprometimento da autenticação',
            solution: 'Verificar configuração do NextAuth e usar NEXTAUTH_SECRET'
          };

          report.vulnerabilities.push(vulnerability);
        }
      } catch {
        this.logger.warn('SecurityAuditor', 'Arquivo de configuração NextAuth não encontrado');
      }

    } catch (error) {
      this.logger.error('SecurityAuditor', 'Erro ao verificar NextAuth', error as Error);
    }
  }

  private async auditPasswordSecurity(report: SecurityReport): Promise<void> {
    this.logger.info('SecurityAuditor', '🔒 Verificando segurança de senhas');

    try {
      // Verificar se bcrypt está sendo usado
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const hasBcrypt = packageJson.dependencies?.bcrypt || 
                       packageJson.dependencies?.bcryptjs ||
                       packageJson.devDependencies?.bcrypt ||
                       packageJson.devDependencies?.bcryptjs;

      if (!hasBcrypt) {
        const vulnerability: SecurityVulnerability = {
          type: 'NO_PASSWORD_HASHING',
          severity: 'CRITICAL',
          description: 'Biblioteca de hash de senhas (bcrypt) não encontrada',
          location: 'package.json',
          impact: 'Senhas podem estar sendo armazenadas em texto plano',
          solution: 'Instalar e usar bcrypt ou bcryptjs para hash de senhas'
        };

        report.vulnerabilities.push(vulnerability);
        report.passwordCompliance = false;
      }

      // Verificar uso correto do bcrypt no código
      const authFiles = [
        'src/app/api/auth/register/route.ts',
        'src/app/api/auth/login/route.ts',
        'src/lib/auth.ts'
      ];

      for (const filePath of authFiles) {
        try {
          const fullPath = path.join(this.projectRoot, filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Verificar se bcrypt.hash está sendo usado
          if (content.includes('bcrypt.hash') || content.includes('bcryptjs.hash')) {
            this.logger.info('SecurityAuditor', `✅ Hash de senha encontrado em ${filePath}`);
          } else if (content.includes('password') && content.includes('create')) {
            // Possível criação de usuário sem hash
            const vulnerability: SecurityVulnerability = {
              type: 'PASSWORD_NOT_HASHED',
              severity: 'CRITICAL',
              description: `Possível armazenamento de senha sem hash em ${filePath}`,
              location: filePath,
              impact: 'Senhas expostas em caso de vazamento de dados',
              solution: 'Usar bcrypt.hash() antes de armazenar senhas'
            };

            report.vulnerabilities.push(vulnerability);
            report.passwordCompliance = false;
          }
        } catch {
          // Arquivo não existe, ok
        }
      }

    } catch (error) {
      this.logger.error('SecurityAuditor', 'Erro ao verificar segurança de senhas', error as Error);
    }
  }

  private async auditDataIsolation(report: SecurityReport): Promise<void> {
    this.logger.info('SecurityAuditor', '🏠 Testando isolamento de dados');

    try {
      // Análise estática de código
      await this.analyzeCodeForDataIsolation(report);

      // Teste dinâmico de isolamento (se possível)
      try {
        const { DataIsolationTester } = await import('./data-isolation-tester');
        const isolationTester = new DataIsolationTester(this.logger);
        
        const isolationResult = await isolationTester.executeDataIsolationTests();
        
        report.dataIsolationScore = isolationResult.score;
        report.vulnerabilities.push(...isolationResult.vulnerabilities);

        this.logger.performanceMetric('SecurityAuditor', 'DATA_ISOLATION_SCORE', isolationResult.score, '%');

      } catch (testError) {
        this.logger.warn('SecurityAuditor', 'Não foi possível executar testes dinâmicos de isolamento', testError as Error);
        // Continuar apenas com análise estática
      }

    } catch (error) {
      this.logger.error('SecurityAuditor', 'Erro ao testar isolamento de dados', error as Error);
    }
  }

  private async analyzeCodeForDataIsolation(report: SecurityReport): Promise<void> {
    // Verificar se as APIs usam filtros de userId
    const apiDir = path.join(this.projectRoot, 'src/app/api');
    const apiFiles = await this.findApiFiles(apiDir);

    let protectedEndpoints = 0;
    let totalEndpoints = 0;

    for (const apiFile of apiFiles) {
      try {
        const content = await fs.readFile(apiFile, 'utf-8');
        totalEndpoints++;

        // Verificar se usa autenticação
        const hasAuth = content.includes('getServerSession') || 
                       content.includes('auth') ||
                       content.includes('session');

        // Verificar se filtra por userId
        const hasUserFilter = content.includes('userId') && 
                             (content.includes('where') || content.includes('filter'));

        if (hasAuth && hasUserFilter) {
          protectedEndpoints++;
        } else {
          // Verificar se é endpoint público (auth, health check, etc.)
          const isPublicEndpoint = apiFile.includes('/auth/') || 
                                  apiFile.includes('/health') ||
                                  apiFile.includes('/public');

          if (!isPublicEndpoint) {
            const vulnerability: SecurityVulnerability = {
              type: 'DATA_ISOLATION_MISSING',
              severity: 'HIGH',
              description: `Endpoint pode não filtrar dados por usuário: ${apiFile}`,
              location: apiFile.replace(this.projectRoot, ''),
              impact: 'Usuários podem acessar dados de outros usuários',
              solution: 'Adicionar filtro userId em todas as queries'
            };

            report.vulnerabilities.push(vulnerability);
          }
        }
      } catch (error) {
        this.logger.warn('SecurityAuditor', `Erro ao analisar ${apiFile}: ${error}`);
      }
    }

    report.apiEndpointsProtected = totalEndpoints > 0 ? 
      (protectedEndpoints / totalEndpoints) * 100 : 100;

    // Se não foi possível fazer teste dinâmico, usar análise estática
    if (report.dataIsolationScore === 100) {
      report.dataIsolationScore = report.apiEndpointsProtected;
    }

    this.logger.performanceMetric('SecurityAuditor', 'API_PROTECTION_RATE', report.apiEndpointsProtected, '%');
  }

  private async auditAPIVulnerabilities(report: SecurityReport): Promise<void> {
    this.logger.info('SecurityAuditor', '🔍 Escaneando vulnerabilidades de API');

    try {
      const apiDir = path.join(this.projectRoot, 'src/app/api');
      const apiFiles = await this.findApiFiles(apiDir);

      for (const apiFile of apiFiles) {
        try {
          const content = await fs.readFile(apiFile, 'utf-8');
          const relativePath = apiFile.replace(this.projectRoot, '');

          // Verificar validação de entrada
          if (content.includes('request.json()') && !content.includes('zod') && !content.includes('validate')) {
            const vulnerability: SecurityVulnerability = {
              type: 'NO_INPUT_VALIDATION',
              severity: 'MEDIUM',
              description: `API sem validação de entrada: ${relativePath}`,
              location: relativePath,
              impact: 'Possível injeção de dados maliciosos',
              solution: 'Implementar validação com Zod ou similar'
            };

            report.vulnerabilities.push(vulnerability);
          }

          // Verificar SQL injection (queries raw)
          if (content.includes('$queryRaw') || content.includes('$executeRaw')) {
            const vulnerability: SecurityVulnerability = {
              type: 'SQL_INJECTION_RISK',
              severity: 'HIGH',
              description: `Possível risco de SQL injection: ${relativePath}`,
              location: relativePath,
              impact: 'Execução de código SQL malicioso',
              solution: 'Usar queries parametrizadas ou Prisma ORM'
            };

            report.vulnerabilities.push(vulnerability);
          }

          // Verificar rate limiting
          if (!content.includes('rateLimit') && !content.includes('throttle')) {
            // Não é crítico, mas é uma boa prática
            this.logger.debug('SecurityAuditor', `API sem rate limiting: ${relativePath}`);
          }

        } catch (error) {
          this.logger.warn('SecurityAuditor', `Erro ao analisar ${apiFile}: ${error}`);
        }
      }

    } catch (error) {
      this.logger.error('SecurityAuditor', 'Erro ao escanear vulnerabilidades', error as Error);
    }
  }

  private async auditDataLeakage(report: SecurityReport): Promise<void> {
    this.logger.info('SecurityAuditor', '🔎 Verificando vazamento de dados');

    try {
      // Verificar logs e console.log com dados sensíveis
      const sourceFiles = await this.findSourceFiles(path.join(this.projectRoot, 'src'));

      for (const sourceFile of sourceFiles) {
        try {
          const content = await fs.readFile(sourceFile, 'utf-8');
          const relativePath = sourceFile.replace(this.projectRoot, '');

          // Verificar console.log com possíveis dados sensíveis
          const consoleLogMatches = content.match(/console\.log\([^)]*\)/g);
          if (consoleLogMatches) {
            for (const match of consoleLogMatches) {
              if (this.containsSensitiveData(match)) {
                const vulnerability: SecurityVulnerability = {
                  type: 'DATA_LEAKAGE_LOG',
                  severity: 'MEDIUM',
                  description: `Possível vazamento de dados em log: ${relativePath}`,
                  location: relativePath,
                  impact: 'Exposição de dados sensíveis em logs',
                  solution: 'Remover ou sanitizar dados sensíveis dos logs'
                };

                report.vulnerabilities.push(vulnerability);
                report.dataLeakageDetected = true;
              }
            }
          }

          // Verificar hardcoded secrets
          if (this.containsHardcodedSecrets(content)) {
            const vulnerability: SecurityVulnerability = {
              type: 'HARDCODED_SECRETS',
              severity: 'HIGH',
              description: `Possíveis credenciais hardcoded: ${relativePath}`,
              location: relativePath,
              impact: 'Exposição de credenciais no código fonte',
              solution: 'Mover credenciais para variáveis de ambiente'
            };

            report.vulnerabilities.push(vulnerability);
          }

        } catch (error) {
          this.logger.warn('SecurityAuditor', `Erro ao analisar ${sourceFile}: ${error}`);
        }
      }

    } catch (error) {
      this.logger.error('SecurityAuditor', 'Erro ao verificar vazamento de dados', error as Error);
    }
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

  private async findSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await this.findSourceFiles(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Diretório não existe ou sem permissão
    }
    
    return files;
  }

  private containsSensitiveData(logStatement: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /auth/i,
      /credential/i,
      /email/i,
      /phone/i,
      /cpf/i,
      /cnpj/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(logStatement));
  }

  private containsHardcodedSecrets(content: string): boolean {
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']{8,}["']/i,
      /secret\s*[:=]\s*["'][^"']{16,}["']/i,
      /key\s*[:=]\s*["'][^"']{16,}["']/i,
      /token\s*[:=]\s*["'][^"']{20,}["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/i
    ];

    return secretPatterns.some(pattern => pattern.test(content));
  }

  private calculateSecurityScore(report: SecurityReport): number {
    let score = 100;

    // Penalizar por vulnerabilidades
    for (const vuln of report.vulnerabilities) {
      switch (vuln.severity) {
        case 'CRITICAL':
          score -= 25;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 8;
          break;
        case 'LOW':
          score -= 3;
          break;
      }
    }

    // Penalizar por configurações inseguras
    if (!report.nextAuthSecretConfigured) {
      score -= 20;
    }

    if (!report.passwordCompliance) {
      score -= 20;
    }

    // Bonificar por proteção de APIs
    score = score * (report.apiEndpointsProtected / 100);

    return Math.max(0, Math.min(100, score));
  }

  private determineAuthStatus(report: SecurityReport): SecurityReport['authenticationStatus'] {
    const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highVulns = report.vulnerabilities.filter(v => v.severity === 'HIGH').length;

    if (criticalVulns > 0 || !report.nextAuthSecretConfigured || !report.passwordCompliance) {
      return 'CRITICAL';
    }

    if (highVulns > 0 || report.dataIsolationScore < 80) {
      return 'VULNERABLE';
    }

    return 'SECURE';
  }
}
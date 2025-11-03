/**
 * Build Configuration Manager (JavaScript version)
 * 
 * Detecta e corrige problemas de configuração de build do Next.js,
 * especialmente incompatibilidades entre build estático e rotas dinâmicas.
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class BuildConfigManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.apiRoutesPattern = 'src/app/api/**/route.ts';
    this.nextConfigPath = path.join(projectRoot, 'next.config.js');
  }

  /**
   * Detecta o modo de build atual baseado na configuração
   */
  async detectBuildMode() {
    try {
      const configContent = await fs.readFile(this.nextConfigPath, 'utf-8');
      
      // Remover comentários para análise
      const lines = configContent.split('\n');
      const activeLines = lines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
      });
      const activeContent = activeLines.join('\n');
      
      // Verifica se tem output: 'export' configurado (não comentado)
      if (activeContent.includes("output: 'export'") || activeContent.includes('output: "export"')) {
        return 'static';
      }
      
      return 'ssr';
    } catch (error) {
      console.warn('⚠️ Não foi possível ler next.config.js, assumindo SSR');
      return 'ssr';
    }
  }

  /**
   * Valida compatibilidade entre configurações
   */
  async validateCompatibility() {
    const results = [];
    
    try {
      const buildMode = await this.detectBuildMode();
      
      if (buildMode === 'static') {
        // Para build estático, verificar se há rotas dinâmicas
        const dynamicRoutes = await this.findDynamicRoutes();
        
        for (const route of dynamicRoutes) {
          results.push({
            type: 'error',
            message: `API route com configuração dinâmica incompatível com build estático`,
            file: route.file,
            line: route.line,
            suggestion: `Remover 'export const dynamic = "force-dynamic"' ou mudar para SSR`
          });
        }
        
        // Verificar rotas dinâmicas sem generateStaticParams
        const dynamicRoutesWithoutParams = await this.findDynamicRoutesWithoutStaticParams();
        for (const route of dynamicRoutesWithoutParams) {
          results.push({
            type: 'error',
            message: `Rota dinâmica sem generateStaticParams() incompatível com build estático`,
            file: route.file,
            suggestion: `Adicionar generateStaticParams() ou remover a rota para build estático`
          });
        }
        
        // Verificar se há dependências de servidor
        const serverDependencies = await this.checkServerDependencies();
        for (const dep of serverDependencies) {
          results.push({
            type: 'warning',
            message: `Dependência de servidor detectada em build estático`,
            file: dep.file,
            suggestion: `Considerar mover lógica para client-side ou usar SSR`
          });
        }
      }
      
      // Verificar variáveis de ambiente necessárias
      const missingEnvVars = await this.checkRequiredEnvVars();
      for (const envVar of missingEnvVars) {
        results.push({
          type: 'warning',
          message: `Variável de ambiente necessária não encontrada: ${envVar}`,
          file: '.env',
          suggestion: `Adicionar ${envVar} ao arquivo .env`
        });
      }
      
    } catch (error) {
      results.push({
        type: 'error',
        message: `Erro durante validação: ${error}`,
        file: 'build-config',
        suggestion: 'Verificar configuração do projeto'
      });
    }
    
    return results;
  }

  /**
   * Encontra todas as rotas com configuração dinâmica
   */
  async findDynamicRoutes() {
    const routes = [];
    
    try {
      const files = await glob(this.apiRoutesPattern);
      console.log(`🔍 Verificando ${files.length} arquivos de API routes...`);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes("dynamic = 'force-dynamic'") || line.includes('dynamic = "force-dynamic"')) {
            console.log(`📍 Encontrado dynamic export em: ${file}:${index + 1}`);
            routes.push({
              file: path.relative(this.projectRoot, file),
              line: index + 1
            });
          }
        });
      }
      
      console.log(`✅ Total de rotas dinâmicas encontradas: ${routes.length}`);
    } catch (error) {
      console.error('❌ Erro ao procurar rotas dinâmicas:', error);
    }
    
    return routes;
  }

  /**
   * Encontra rotas dinâmicas sem generateStaticParams
   */
  async findDynamicRoutesWithoutStaticParams() {
    const routes = [];
    
    try {
      // Procurar por arquivos com parâmetros dinâmicos [id], [slug], etc.
      const dynamicPattern = 'src/app/api/**/*\\[*\\]*/route.ts';
      const files = await glob(dynamicPattern);
      
      console.log(`🔍 Verificando ${files.length} rotas dinâmicas para generateStaticParams...`);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Verificar se tem generateStaticParams
        if (!content.includes('generateStaticParams')) {
          console.log(`📍 Rota dinâmica sem generateStaticParams: ${file}`);
          routes.push({
            file: path.relative(this.projectRoot, file)
          });
        }
      }
      
      console.log(`✅ Total de rotas dinâmicas sem generateStaticParams: ${routes.length}`);
    } catch (error) {
      console.error('❌ Erro ao procurar rotas dinâmicas sem generateStaticParams:', error);
    }
    
    return routes;
  }

  /**
   * Verifica dependências que requerem servidor
   */
  async checkServerDependencies() {
    const serverDeps = [];
    
    try {
      const files = await glob(this.apiRoutesPattern);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Verificar imports que indicam dependências de servidor
        const serverImports = [
          'prisma',
          'fs/promises',
          'child_process',
          'crypto',
          'net',
          'tls'
        ];
        
        for (const dep of serverImports) {
          if (content.includes(`from '${dep}'`) || content.includes(`require('${dep}')`)) {
            serverDeps.push({ file: path.relative(this.projectRoot, file) });
            break;
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar dependências:', error);
    }
    
    return serverDeps;
  }

  /**
   * Verifica variáveis de ambiente necessárias
   */
  async checkRequiredEnvVars() {
    const required = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'DATABASE_URL'
    ];
    
    const missing = [];
    
    for (const envVar of required) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    
    return missing;
  }

  /**
   * Corrige automaticamente problemas detectados
   */
  async autoCorrectIssues(convertToSSR = false) {
    const results = [];
    const buildMode = await this.detectBuildMode();
    
    if (buildMode === 'static') {
      // Remover configurações dinâmicas para build estático
      const dynamicRoutes = await this.findDynamicRoutes();
      
      for (const route of dynamicRoutes) {
        const correctionResult = await this.removeDynamicExport(route.file);
        results.push(correctionResult);
      }
      
      // Para rotas dinâmicas sem generateStaticParams
      const dynamicRoutesWithoutParams = await this.findDynamicRoutesWithoutStaticParams();
      
      if (dynamicRoutesWithoutParams.length > 0) {
        if (convertToSSR) {
          // Converter para SSR removendo output: "export"
          const ssrResult = await this.convertToSSR();
          results.push(ssrResult);
        } else {
          results.push({
            file: 'next.config.js',
            action: 'suggest_ssr_conversion',
            success: false,
            error: `${dynamicRoutesWithoutParams.length} rotas dinâmicas encontradas. Use --convert-to-ssr para converter automaticamente para SSR`
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Converte configuração para SSR removendo output: "export"
   */
  async convertToSSR() {
    try {
      // Criar backup primeiro
      const backupResult = await this.createBackup(this.nextConfigPath);
      if (!backupResult.success) {
        return {
          file: 'next.config.js',
          action: 'convert_to_ssr',
          success: false,
          error: `Falha ao criar backup: ${backupResult.error}`
        };
      }
      
      // Ler configuração atual
      const content = await fs.readFile(this.nextConfigPath, 'utf-8');
      
      // Remover ou comentar output: 'export' e distDir: 'out'
      const modifiedContent = content
        .replace(/output:\s*['"]export['"],?\s*/g, '// output: "export", // Removido para SSR\n  ')
        .replace(/output:\s*['"]export['"];?\s*/g, '// output: "export"; // Removido para SSR\n  ')
        .replace(/distDir:\s*['"]out['"],?\s*/g, '// distDir: "out", // Removido para SSR\n  ')
        .replace(/distDir:\s*['"]out['"];?\s*/g, '// distDir: "out"; // Removido para SSR\n  ');
      
      // Escrever configuração modificada
      await fs.writeFile(this.nextConfigPath, modifiedContent, 'utf-8');
      
      return {
        file: 'next.config.js',
        action: 'convert_to_ssr',
        success: true
      };
      
    } catch (error) {
      return {
        file: 'next.config.js',
        action: 'convert_to_ssr',
        success: false,
        error: `Erro ao converter para SSR: ${error}`
      };
    }
  }

  /**
   * Remove export const dynamic = 'force-dynamic' de um arquivo
   */
  async removeDynamicExport(relativePath) {
    const filePath = path.join(this.projectRoot, relativePath);
    
    try {
      // Criar backup primeiro
      const backupResult = await this.createBackup(filePath);
      if (!backupResult.success) {
        return {
          file: relativePath,
          action: 'removed_dynamic_export',
          success: false,
          error: `Falha ao criar backup: ${backupResult.error}`
        };
      }
      
      // Ler conteúdo atual
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Remover linhas com dynamic export
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        return !(
          trimmed.includes("export const dynamic = 'force-dynamic'") ||
          trimmed.includes('export const dynamic = "force-dynamic"') ||
          trimmed === "export const dynamic = 'force-dynamic';" ||
          trimmed === 'export const dynamic = "force-dynamic";'
        );
      });
      
      // Escrever conteúdo modificado
      const newContent = filteredLines.join('\n');
      await fs.writeFile(filePath, newContent, 'utf-8');
      
      return {
        file: relativePath,
        action: 'removed_dynamic_export',
        success: true
      };
      
    } catch (error) {
      return {
        file: relativePath,
        action: 'removed_dynamic_export',
        success: false,
        error: `Erro ao modificar arquivo: ${error}`
      };
    }
  }

  /**
   * Cria backup de um arquivo
   */
  async createBackup(filePath) {
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await fs.copyFile(filePath, backupPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Gera configuração Next.js baseada no modo
   */
  async generateConfig() {
    const buildMode = await this.detectBuildMode();
    const dynamicRoutes = await this.findDynamicRoutes();
    
    return {
      mode: buildMode,
      dynamicRoutes: dynamicRoutes.map(r => r.file),
      staticRoutes: [], // TODO: implementar detecção de rotas estáticas
      optimizations: {
        bundleAnalyzer: process.env.ANALYZE === 'true',
        compression: true,
        imageOptimization: true,
        codesplitting: true
      }
    };
  }

  /**
   * Gera relatório completo de compatibilidade
   */
  async generateCompatibilityReport() {
    const buildMode = await this.detectBuildMode();
    const issues = await this.validateCompatibility();
    
    const recommendations = [];
    
    if (buildMode === 'static' && issues.some(i => i.type === 'error')) {
      recommendations.push(
        'Para build estático, considere:',
        '1. Remover todas as API routes dinâmicas',
        '2. Mover lógica de servidor para client-side',
        '3. Usar APIs externas ou serverless functions',
        'OU mudar para SSR removendo output: "export"'
      );
    }
    
    if (issues.some(i => i.message.includes('variável de ambiente'))) {
      recommendations.push(
        'Configurar variáveis de ambiente necessárias no .env'
      );
    }
    
    return {
      buildMode,
      issues,
      recommendations
    };
  }
}

module.exports = { BuildConfigManager };
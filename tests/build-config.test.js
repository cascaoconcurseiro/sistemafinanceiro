/**
 * Testes para Build Configuration Manager
 */

const { BuildConfigManager } = require('../scripts/build-config-manager.js');
const fs = require('fs').promises;
const path = require('path');

describe('Build Configuration Manager', () => {
  let manager;
  let testDir;

  beforeEach(async () => {
    // Criar diretório temporário para testes
    testDir = path.join(__dirname, 'temp-test-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
    
    manager = new BuildConfigManager(testDir);
  });

  afterEach(async () => {
    // Limpar diretório temporário
    try {
      await fs.rmdir(testDir, { recursive: true });
    } catch (error) {
      // Ignorar erros de limpeza
    }
  });

  describe('detectBuildMode', () => {
    test('deve detectar build estático quando output: "export" está presente', async () => {
      const configContent = `
        const nextConfig = {
          output: 'export',
          trailingSlash: true
        };
        module.exports = nextConfig;
      `;
      
      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      
      const mode = await manager.detectBuildMode();
      expect(mode).toBe('static');
    });

    test('deve detectar SSR quando output: "export" não está presente', async () => {
      const configContent = `
        const nextConfig = {
          trailingSlash: true
        };
        module.exports = nextConfig;
      `;
      
      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      
      const mode = await manager.detectBuildMode();
      expect(mode).toBe('ssr');
    });

    test('deve assumir SSR quando next.config.js não existe', async () => {
      const mode = await manager.detectBuildMode();
      expect(mode).toBe('ssr');
    });
  });

  describe('findDynamicRoutes', () => {
    test('deve encontrar rotas com export const dynamic = "force-dynamic"', async () => {
      // Criar estrutura de diretórios
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const routeContent = `
        import { NextRequest, NextResponse } from 'next/server';
        
        export async function GET(request) {
          return NextResponse.json({ message: 'test' });
        }
        
        export const dynamic = 'force-dynamic';
      `;
      
      await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
      
      const routes = await manager.findDynamicRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0].file).toContain('src/app/api/test/route.ts');
      expect(routes[0].line).toBe(7);
    });

    test('não deve encontrar rotas sem export dynamic', async () => {
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const routeContent = `
        import { NextRequest, NextResponse } from 'next/server';
        
        export async function GET(request) {
          return NextResponse.json({ message: 'test' });
        }
      `;
      
      await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
      
      const routes = await manager.findDynamicRoutes();
      expect(routes).toHaveLength(0);
    });
  });

  describe('validateCompatibility', () => {
    test('deve reportar erro para build estático com rotas dinâmicas', async () => {
      // Configurar build estático
      const configContent = `
        const nextConfig = {
          output: 'export'
        };
        module.exports = nextConfig;
      `;
      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      
      // Criar rota dinâmica
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const routeContent = `
        export async function GET() {}
        export const dynamic = 'force-dynamic';
      `;
      await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
      
      const issues = await manager.validateCompatibility();
      
      const errors = issues.filter(i => i.type === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('incompatível com build estático');
    });

    test('não deve reportar erros para SSR com rotas dinâmicas', async () => {
      // Configurar SSR (sem output: export)
      const configContent = `
        const nextConfig = {
          trailingSlash: true
        };
        module.exports = nextConfig;
      `;
      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      
      // Criar rota dinâmica
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const routeContent = `
        export async function GET() {}
        export const dynamic = 'force-dynamic';
      `;
      await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
      
      const issues = await manager.validateCompatibility();
      
      const dynamicErrors = issues.filter(i => 
        i.type === 'error' && i.message.includes('incompatível com build estático')
      );
      expect(dynamicErrors).toHaveLength(0);
    });
  });

  describe('removeDynamicExport', () => {
    test('deve remover export const dynamic = "force-dynamic"', async () => {
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const originalContent = `
        import { NextRequest, NextResponse } from 'next/server';
        
        export async function GET(request) {
          return NextResponse.json({ message: 'test' });
        }
        
        export const dynamic = 'force-dynamic';
      `;
      
      const filePath = path.join(apiDir, 'route.ts');
      await fs.writeFile(filePath, originalContent);
      
      const result = await manager.removeDynamicExport('src/app/api/test/route.ts');
      
      expect(result.success).toBe(true);
      
      const modifiedContent = await fs.readFile(filePath, 'utf-8');
      expect(modifiedContent).not.toContain('export const dynamic = \'force-dynamic\'');
      expect(modifiedContent).toContain('export async function GET');
    });

    test('deve criar backup antes de modificar arquivo', async () => {
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const originalContent = `export const dynamic = 'force-dynamic';`;
      const filePath = path.join(apiDir, 'route.ts');
      await fs.writeFile(filePath, originalContent);
      
      await manager.removeDynamicExport('src/app/api/test/route.ts');
      
      // Verificar se backup foi criado
      const files = await fs.readdir(apiDir);
      const backupFiles = files.filter(f => f.includes('.backup.'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('convertToSSR', () => {
    test('deve comentar output: "export" no next.config.js', async () => {
      const originalConfig = `
        const nextConfig = {
          output: 'export',
          trailingSlash: true,
          distDir: 'out'
        };
        module.exports = nextConfig;
      `;
      
      await fs.writeFile(path.join(testDir, 'next.config.js'), originalConfig);
      
      const result = await manager.convertToSSR();
      
      expect(result.success).toBe(true);
      
      const modifiedConfig = await fs.readFile(path.join(testDir, 'next.config.js'), 'utf-8');
      expect(modifiedConfig).toContain('// output: "export"');
      expect(modifiedConfig).toContain('// distDir: "out"');
      expect(modifiedConfig).not.toContain('output: \'export\'');
    });

    test('deve criar backup do next.config.js', async () => {
      const originalConfig = `const nextConfig = { output: 'export' };`;
      await fs.writeFile(path.join(testDir, 'next.config.js'), originalConfig);
      
      await manager.convertToSSR();
      
      const files = await fs.readdir(testDir);
      const backupFiles = files.filter(f => f.includes('next.config.js.backup.'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('generateCompatibilityReport', () => {
    test('deve gerar relatório completo com recomendações', async () => {
      // Configurar cenário com problemas
      const configContent = `const nextConfig = { output: 'export' };`;
      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const routeContent = `export const dynamic = 'force-dynamic';`;
      await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
      
      const report = await manager.generateCompatibilityReport();
      
      expect(report.buildMode).toBe('static');
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('SSR'))).toBe(true);
    });
  });
});

// Testes de integração
describe('Build Configuration Integration', () => {
  test('deve corrigir automaticamente problemas de build estático', async () => {
    const testDir = path.join(__dirname, 'integration-test-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
    
    try {
      const manager = new BuildConfigManager(testDir);
      
      // Configurar cenário problemático
      const configContent = `const nextConfig = { output: 'export', distDir: 'out' };`;
      await fs.writeFile(path.join(testDir, 'next.config.js'), configContent);
      
      const apiDir = path.join(testDir, 'src', 'app', 'api', 'test');
      await fs.mkdir(apiDir, { recursive: true });
      
      const routeContent = `
        export async function GET() {}
        export const dynamic = 'force-dynamic';
      `;
      await fs.writeFile(path.join(apiDir, 'route.ts'), routeContent);
      
      // Verificar problemas iniciais
      const initialIssues = await manager.validateCompatibility();
      const initialErrors = initialIssues.filter(i => i.type === 'error');
      expect(initialErrors.length).toBeGreaterThan(0);
      
      // Aplicar correções
      const corrections = await manager.autoCorrectIssues(true);
      expect(corrections.some(c => c.success)).toBe(true);
      
      // Verificar se problemas foram corrigidos
      const finalIssues = await manager.validateCompatibility();
      const finalErrors = finalIssues.filter(i => i.type === 'error');
      expect(finalErrors.length).toBeLessThan(initialErrors.length);
      
    } finally {
      await fs.rmdir(testDir, { recursive: true });
    }
  });
});
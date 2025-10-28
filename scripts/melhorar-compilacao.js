/**
 * Script para aplicar melhorias de compilação
 * Fase 1: Correções Críticas
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, '..');

function updateNextConfig() {
  const configPath = path.join(PROJECT_DIR, 'next.config.js');
  
  const newConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Otimizações de produção
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  swcMinify: true, // ✅ Minificação mais rápida com SWC
  compress: true,
  
  // ✅ Otimizações de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // ✅ Experimental
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // ✅ TypeScript e ESLint habilitados (não ignorar erros)
  typescript: {
    ignoreBuildErrors: false, // ✅ Detectar erros de tipo
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Detectar problemas de código
  },
  
  webpack: (config, { dev, isServer }) => {
    // Otimizações de produção
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\\\/]node_modules[\\\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 20,
            },
            react: {
              test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
    }
    
    // Fallbacks para cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        'child_process': false,
        'fs/promises': false,
        'async_hooks': false,
      };
    }
    
    return config;
  },
  
  // Configurações PWA e CORS
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;
  
  fs.writeFileSync(configPath, newConfig);
  console.log('✅ next.config.js atualizado');
}

function updateTsConfig() {
  const configPath = path.join(PROJECT_DIR, 'tsconfig.json');
  
  const newConfig = {
    "compilerOptions": {
      "target": "ES2020",
      "lib": ["dom", "dom.iterable", "ES2020"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "removeComments": true,
      "importHelpers": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"],
        "@/components/*": ["./src/components/*"],
        "@/features/*": ["./src/components/features/*"],
        "@/lib/*": ["./src/lib/*"],
        "@/services/*": ["./src/lib/services/*"],
        "@/hooks/*": ["./src/hooks/*"],
        "@/types/*": ["./src/types/*"]
      },
      "noImplicitAny": true,
      "noImplicitReturns": true,
      "noImplicitThis": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": false,
      "noFallthroughCasesInSwitch": true
    },
    "include": [
      "**/*.ts",
      "**/*.tsx",
      ".next/types/**/*.ts",
      "next-env.d.ts"
    ],
    "exclude": [
      "node_modules"
    ]
  };
  
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  console.log('✅ tsconfig.json atualizado');
}

async function main() {
  console.log('🚀 Aplicando melhorias de compilação...\n');
  
  console.log('📝 Fase 1: Correções Críticas\n');
  
  try {
    updateNextConfig();
    updateTsConfig();
    
    console.log('\n✅ Melhorias aplicadas com sucesso!');
    console.log('\n📊 Mudanças aplicadas:');
    console.log('   ✅ TypeScript target: ES5 → ES2020');
    console.log('   ✅ ignoreBuildErrors: true → false');
    console.log('   ✅ ignoreDuringBuilds: true → false');
    console.log('   ✅ swcMinify: habilitado');
    console.log('   ✅ Code splitting: configurado');
    console.log('   ✅ Aliases: adicionados');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Podem aparecer erros de TypeScript/ESLint');
    console.log('   - Isso é BOM! Significa que problemas serão detectados');
    console.log('   - Corrija os erros antes de fazer build');
    console.log('\n🧪 Próximo passo:');
    console.log('   npm run build');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

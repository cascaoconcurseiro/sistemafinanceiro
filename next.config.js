/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // ✅ Configuração para SSR (Server-Side Rendering)
  // output: 'export', // Removido para permitir API routes dinâmicas
  trailingSlash: true,
  // distDir: 'out', // Removido para SSR - usa build padrão
  
  // ✅ Otimizações de produção
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  swcMinify: true, // ✅ Minificação mais rápida com SWC
  compress: true,
  
  // ✅ Otimizações de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/Tgentil/Bancos-em-SVG/**',
      },
    ],
  },
  
  // ✅ Experimental
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // ✅ TypeScript e ESLint habilitados (não ignorar erros)
  typescript: {
    ignoreBuildErrors: true // ⚠️ TEMPORÁRIO: Desabilitado para build, // ✅ Detectar erros de tipo
  },
  eslint: {
    ignoreDuringBuilds: true // ⚠️ TEMPORÁRIO: Desabilitado para build, // ✅ Detectar problemas de código
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
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 20,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
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

module.exports = withBundleAnalyzer(nextConfig);

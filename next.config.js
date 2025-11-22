/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para deploy no Netlify com suporte a API routes
  // Removido output: 'export' para permitir rotas de API dinâmicas
  trailingSlash: true,
  
  // Configuração de imagens para Netlify
  images: {
    unoptimized: true,
  },
  
  // Configurações de build
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  swcMinify: true,
  compress: true,
  
  // TypeScript e ESLint (ignorar erros para build)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Headers de segurança e CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Desabilitar API routes para build estático
  async rewrites() {
    return [];
  },
  
  webpack: (config, { dev, isServer }) => {
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
    
    // Ignorar API routes durante o build estático
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/prisma': false,
        '@/lib/db': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
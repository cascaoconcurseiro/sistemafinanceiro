/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para deploy estático no Netlify
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  
  // Desabilitar otimizações que requerem servidor
  images: {
    unoptimized: true,
  },
  
  // Desabilitar API routes
  experimental: {
    appDir: true,
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
    
    return config;
  },
};

module.exports = nextConfig;
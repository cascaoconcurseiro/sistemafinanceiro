/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 🔒 HABILITADO: ESLint deve rodar durante builds para bloquear violações financeiras
    ignoreDuringBuilds: false,
    // Diretórios para verificar
    dirs: ['src', 'pages', 'components', 'hooks', 'lib', 'utils'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true, // Habilitando strict mode para debug
  
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
